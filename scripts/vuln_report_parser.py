#!/usr/bin/env python3
"""
vuln_report_parser.py — Nessus / CSV Vulnerability Report Parser
Author: Anthony Smith | Junior Security Engineer Portfolio
Description:
    Parses exported Nessus .csv vulnerability reports and produces:
      - Severity breakdown (Critical / High / Medium / Low / Info)
      - Top affected hosts ranked by risk score
      - CVSS score distribution
      - Remediation priority queue (sorted by CVSS descending)
      - Markdown summary report

    Designed for WGU cybersecurity coursework and real-world scan triage.

Usage:
    python vuln_report_parser.py --input nessus_export.csv --output report.md
    python vuln_report_parser.py --input nessus_export.csv --top-hosts 10

Nessus CSV columns expected (standard export):
    Plugin ID, CVE, CVSS v2.0 Base Score, Risk, Host, Protocol, Port,
    Name, Synopsis, Description, Solution, See Also, Plugin Output
"""

import argparse
import csv
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime


SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "None": 4, "": 5}
SEVERITY_EMOJI = {
    "Critical": "🔴", "High": "🟠", "Medium": "🟡",
    "Low": "🟢", "None": "⬜", "": "⬜",
}

# Approximate CVSS → severity mapping for hosts without explicit "Risk" column
def cvss_to_severity(score: float) -> str:
    if score >= 9.0:  return "Critical"
    if score >= 7.0:  return "High"
    if score >= 4.0:  return "Medium"
    if score > 0:     return "Low"
    return "None"


def load_csv(filepath: str) -> list[dict]:
    """Load Nessus CSV export. Returns list of vulnerability dicts."""
    rows = []
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Normalize CVSS score
            raw_cvss = row.get("CVSS v2.0 Base Score", row.get("CVSS", "0")).strip()
            try:
                cvss = float(raw_cvss) if raw_cvss else 0.0
            except ValueError:
                cvss = 0.0
            row["_cvss_float"] = cvss

            # Normalize Risk / Severity field
            risk = row.get("Risk", row.get("Severity", "")).strip().capitalize()
            if not risk and cvss > 0:
                risk = cvss_to_severity(cvss)
            row["_risk_norm"] = risk
            rows.append(row)
    return rows


def severity_breakdown(vulns: list[dict]) -> Counter:
    """Count vulnerabilities by severity level."""
    return Counter(v["_risk_norm"] for v in vulns)


def top_hosts_by_risk(vulns: list[dict], n: int = 10) -> list[tuple]:
    """Rank hosts by total CVSS score (higher = more critical)."""
    host_scores = defaultdict(float)
    host_counts = defaultdict(int)
    for v in vulns:
        host = v.get("Host", "unknown")
        host_scores[host] += v["_cvss_float"]
        host_counts[host] += 1
    ranked = sorted(host_scores.items(), key=lambda x: x[1], reverse=True)
    return [(host, score, host_counts[host]) for host, score in ranked[:n]]


def remediation_queue(vulns: list[dict], limit: int = 50) -> list[dict]:
    """Return top vulnerabilities sorted by CVSS score for remediation triage."""
    # Deduplicate by Plugin ID + Host
    seen = set()
    unique = []
    for v in vulns:
        key = (v.get("Plugin ID", ""), v.get("Host", ""))
        if key not in seen and v["_cvss_float"] > 0:
            seen.add(key)
            unique.append(v)
    return sorted(unique, key=lambda x: x["_cvss_float"], reverse=True)[:limit]


def generate_markdown(vulns: list[dict], top_n: int, output_path: str):
    """Write a Markdown remediation report."""
    breakdown = severity_breakdown(vulns)
    hosts     = top_hosts_by_risk(vulns, top_n)
    queue     = remediation_queue(vulns, limit=30)

    lines = [
        f"# Vulnerability Assessment Report",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ",
        f"**Author:** Anthony Smith | Junior Security Engineer  ",
        f"**Total Findings:** {len(vulns)}  ",
        "",
        "---",
        "",
        "## Severity Breakdown",
        "",
        "| Severity | Count |",
        "|----------|-------|",
    ]
    for sev in ["Critical", "High", "Medium", "Low", "None"]:
        icon  = SEVERITY_EMOJI.get(sev, "")
        count = breakdown.get(sev, 0)
        lines.append(f"| {icon} {sev} | {count} |")

    lines += [
        "",
        "---",
        "",
        f"## Top {top_n} Hosts by Risk Score",
        "",
        "| Rank | Host | Total CVSS | Finding Count |",
        "|------|------|-----------|---------------|",
    ]
    for i, (host, score, count) in enumerate(hosts, 1):
        lines.append(f"| {i} | `{host}` | {score:.1f} | {count} |")

    lines += [
        "",
        "---",
        "",
        "## Remediation Priority Queue (Top 30)",
        "",
        "| Priority | Host | Vulnerability | CVSS | Severity | Solution |",
        "|----------|------|---------------|------|----------|---------|",
    ]
    for i, v in enumerate(queue, 1):
        host    = v.get("Host", "")
        name    = v.get("Name", "")[:60]
        cvss    = f"{v['_cvss_float']:.1f}"
        sev     = v.get("_risk_norm", "")
        sol     = v.get("Solution", "See vendor advisory")[:80].replace("|", "\\|")
        lines.append(f"| {i} | `{host}` | {name} | {cvss} | {sev} | {sol} |")

    lines += [
        "",
        "---",
        "",
        "## Remediation Notes",
        "",
        "- Prioritize **Critical** and **High** findings immediately.",
        "- Apply vendor patches and CVE advisories referenced in 'See Also'.",
        "- Re-scan after remediation to confirm closure.",
        "- Document all changes in the change management system.",
        "",
        "_Report generated by vuln_report_parser.py — Anthony Smith Security Portfolio_",
    ]

    with open(output_path, "w") as f:
        f.write("\n".join(lines))
    print(f"[+] Markdown report saved to: {output_path}")


def print_terminal_summary(vulns: list[dict], top_n: int):
    """Print condensed summary to terminal."""
    sep = "─" * 60
    breakdown = severity_breakdown(vulns)
    hosts     = top_hosts_by_risk(vulns, top_n)
    queue     = remediation_queue(vulns, limit=10)

    print(f"\n{'='*60}")
    print("  Vulnerability Report Parser | Anthony Smith")
    print(f"{'='*60}")
    print(f"\nTotal findings: {len(vulns)}\n")

    print(f"{sep}\nSEVERITY BREAKDOWN\n{sep}")
    for sev in ["Critical", "High", "Medium", "Low", "None"]:
        count = breakdown.get(sev, 0)
        bar   = "█" * min(30, count)
        print(f"  {sev:<10} {count:>5}  {bar}")

    print(f"\n{sep}\nTOP {top_n} HOSTS BY RISK SCORE\n{sep}")
    for i, (host, score, count) in enumerate(hosts, 1):
        print(f"  {i:>2}. {host:<20} score={score:.1f}  findings={count}")

    print(f"\n{sep}\nTOP 10 REMEDIATION PRIORITIES\n{sep}")
    for i, v in enumerate(queue, 1):
        print(f"  {i:>2}. [{v['_cvss_float']:.1f}] {v.get('Name','')[:50]}")
        print(f"      Host: {v.get('Host','')}  |  Risk: {v.get('_risk_norm','')}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Nessus CSV Vulnerability Report Parser — Anthony Smith",
        epilog="Example:\n  python vuln_report_parser.py --input scan.csv --output report.md",
    )
    parser.add_argument("--input",     required=True,       help="Path to Nessus CSV export")
    parser.add_argument("--output",    default=None,        help="Output Markdown report path")
    parser.add_argument("--top-hosts", type=int, default=10, help="Number of top hosts to display")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"[!] Input file not found: {args.input}")
        sys.exit(1)

    vulns = load_csv(args.input)
    print_terminal_summary(vulns, args.top_hosts)

    if args.output:
        generate_markdown(vulns, args.top_hosts, args.output)


if __name__ == "__main__":
    main()
