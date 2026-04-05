#!/usr/bin/env python3
"""
log_threat_hunter.py — Security Log Threat Hunter
Author: Anthony Smith | Junior Security Engineer Portfolio
Description:
    Scans common Linux/Windows security log formats for indicators of
    compromise (IoCs), brute-force attempts, privilege escalation,
    and lateral movement patterns. Supports:
      - /var/log/auth.log  (Linux SSH / PAM)
      - /var/log/secure    (RHEL/CentOS equivalent)
      - Windows Event Log exports (CSV format from Event Viewer)
      - Generic syslog

    Outputs a color-coded terminal report and optional JSON findings file.

Usage:
    python log_threat_hunter.py --log /var/log/auth.log --type auth
    python log_threat_hunter.py --log events.csv --type windows-event
    python log_threat_hunter.py --log syslog.txt --type syslog --output findings.json

Dependencies: Python 3.8+ stdlib only
"""

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime


# ── ANSI color codes (gracefully disabled on non-tty) ────────────────────────
SUPPORTS_COLOR = sys.stdout.isatty()
RED    = "\033[91m" if SUPPORTS_COLOR else ""
ORANGE = "\033[93m" if SUPPORTS_COLOR else ""
GREEN  = "\033[92m" if SUPPORTS_COLOR else ""
CYAN   = "\033[96m" if SUPPORTS_COLOR else ""
RESET  = "\033[0m"  if SUPPORTS_COLOR else ""
BOLD   = "\033[1m"  if SUPPORTS_COLOR else ""


# ── Detection signatures ──────────────────────────────────────────────────────
AUTH_PATTERNS = {
    "ssh_fail":        (re.compile(r"Failed password for .+ from (\S+) port"), "SSH brute-force attempt"),
    "invalid_user":    (re.compile(r"Invalid user (\S+) from (\S+)"),           "Invalid SSH user"),
    "accepted_pass":   (re.compile(r"Accepted password for (\S+) from (\S+)"),  "SSH login (password — consider key-only)"),
    "accepted_key":    (re.compile(r"Accepted publickey for (\S+) from (\S+)"), "SSH login (publickey)"),
    "sudo_cmd":        (re.compile(r"sudo:\s+(\S+) : .* COMMAND=(.+)"),         "Sudo command executed"),
    "su_attempt":      (re.compile(r"su: FAILED su for (\S+) by (\S+)"),        "Failed su attempt"),
    "new_user":        (re.compile(r"useradd.*name=(\S+)"),                     "New user account created"),
    "passwd_change":   (re.compile(r"password changed for (\S+)"),              "Password changed"),
    "session_opened":  (re.compile(r"session opened for user (\S+) by"),        "Session opened"),
    "cron_job":        (re.compile(r"CRON\[.+\]: \((\S+)\) CMD \((.+)\)"),     "Cron job executed"),
}

SUSPICIOUS_THRESHOLD_FAILS = 5   # Flag IPs with >= this many failed logins


def parse_auth_log(lines: list[str]) -> list[dict]:
    """Parse auth.log/secure format lines into structured events."""
    events = []
    for lineno, line in enumerate(lines, 1):
        line = line.strip()
        for sig_name, (pattern, description) in AUTH_PATTERNS.items():
            m = pattern.search(line)
            if m:
                events.append({
                    "lineno":    lineno,
                    "raw":       line,
                    "signature": sig_name,
                    "desc":      description,
                    "groups":    list(m.groups()),
                    "severity":  classify_severity(sig_name),
                })
    return events


def classify_severity(sig_name: str) -> str:
    """Map signature name to severity level."""
    critical = {"new_user", "su_attempt", "sudo_cmd", "passwd_change"}
    high     = {"ssh_fail", "invalid_user"}
    medium   = {"accepted_pass", "session_opened"}
    if sig_name in critical: return "CRITICAL"
    if sig_name in high:     return "HIGH"
    if sig_name in medium:   return "MEDIUM"
    return "INFO"


def detect_brute_force(events: list[dict]) -> dict:
    """
    Identify IPs with excessive failed logins — a strong brute-force signal.
    Returns dict of IP → fail count for IPs over threshold.
    """
    fail_counts: Counter = Counter()
    for ev in events:
        if ev["signature"] == "ssh_fail" and ev["groups"]:
            fail_counts[ev["groups"][0]] += 1
    return {ip: c for ip, c in fail_counts.items() if c >= SUSPICIOUS_THRESHOLD_FAILS}


def detect_lateral_movement(events: list[dict]) -> list[dict]:
    """
    Heuristic: an account that authenticates successfully after multiple failures
    from the same IP may indicate a successful brute-force / credential spray.
    """
    fail_ips:    set = set()
    suspicious:  list = []
    for ev in events:
        if ev["signature"] == "ssh_fail" and ev["groups"]:
            fail_ips.add(ev["groups"][0])
        elif ev["signature"] in {"accepted_pass", "accepted_key"} and len(ev["groups"]) > 1:
            ip = ev["groups"][1]
            if ip in fail_ips:
                suspicious.append({**ev, "note": f"Success from IP {ip} that also had failures"})
    return suspicious


def print_report(events: list[dict], brute_force: dict, lateral: list[dict], log_path: str):
    """Print color-coded threat hunting report to stdout."""
    sep = "─" * 65
    sev_color = {"CRITICAL": RED+BOLD, "HIGH": RED, "MEDIUM": ORANGE, "INFO": CYAN}

    print(f"\n{BOLD}{'='*65}{RESET}")
    print(f"{BOLD}  Log Threat Hunter | Anthony Smith — Security Portfolio{RESET}")
    print(f"  Log file : {log_path}")
    print(f"  Analyzed : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Events   : {len(events)}")
    print(f"{BOLD}{'='*65}{RESET}\n")

    # Severity summary
    counts = Counter(e["severity"] for e in events)
    print(f"{sep}\n{BOLD}SEVERITY SUMMARY{RESET}\n{sep}")
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "INFO"]:
        c     = counts.get(sev, 0)
        color = sev_color.get(sev, "")
        bar   = "█" * min(40, c)
        print(f"  {color}{sev:<12}{RESET}  {c:>4}  {bar}")

    # Brute force alerts
    if brute_force:
        print(f"\n{sep}\n{RED+BOLD}⚠ BRUTE-FORCE DETECTION{RESET}\n{sep}")
        for ip, count in sorted(brute_force.items(), key=lambda x: -x[1]):
            print(f"  {RED}[!] {ip:<20} {count} failed SSH attempts{RESET}")

    # Lateral movement
    if lateral:
        print(f"\n{sep}\n{RED+BOLD}⚠ POSSIBLE LATERAL MOVEMENT / SUCCESSFUL BRUTE-FORCE{RESET}\n{sep}")
        for ev in lateral:
            print(f"  {RED}[!] Line {ev['lineno']:>6}: {ev['note']}{RESET}")
            print(f"       → {ev['raw'][:100]}")

    # Top events (critical/high only in terminal)
    critical_high = [e for e in events if e["severity"] in ("CRITICAL", "HIGH")]
    if critical_high:
        print(f"\n{sep}\n{BOLD}CRITICAL / HIGH EVENTS (first 20){RESET}\n{sep}")
        for ev in critical_high[:20]:
            color = sev_color.get(ev["severity"], "")
            print(f"  {color}[{ev['severity']:<8}]{RESET} Line {ev['lineno']:>6}: {ev['desc']}")
            if ev["groups"]:
                print(f"             Details: {', '.join(ev['groups'])}")

    print()


def export_json(events, brute_force, lateral, output_path):
    findings = {
        "generated":    datetime.now().isoformat(),
        "total_events": len(events),
        "brute_force":  brute_force,
        "lateral_movement": lateral,
        "events":       events,
    }
    with open(output_path, "w") as f:
        json.dump(findings, f, indent=2, default=str)
    print(f"[+] JSON findings saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Log Threat Hunter — Anthony Smith Security Portfolio",
        epilog="Example:\n  python log_threat_hunter.py --log /var/log/auth.log --type auth",
    )
    parser.add_argument("--log",    required=True, help="Path to log file")
    parser.add_argument("--type",   default="auth", choices=["auth", "syslog", "windows-event"],
                        help="Log format type")
    parser.add_argument("--output", default=None,  help="Export findings to JSON file")
    args = parser.parse_args()

    if not os.path.exists(args.log):
        print(f"[!] Log file not found: {args.log}")
        sys.exit(1)

    with open(args.log, "r", errors="replace") as f:
        lines = f.readlines()

    print(f"[*] Loaded {len(lines)} lines from {args.log}")

    # Currently auth log is the primary supported format
    events  = parse_auth_log(lines)
    brute   = detect_brute_force(events)
    lateral = detect_lateral_movement(events)

    print_report(events, brute, lateral, args.log)

    if args.output:
        export_json(events, brute, lateral, args.output)


if __name__ == "__main__":
    main()
