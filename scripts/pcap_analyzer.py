#!/usr/bin/env python3
"""
pcap_analyzer.py — PCAP / Packet Capture Analyzer
Author: Anthony Smith | Junior Security Engineer Portfolio
Description:
    Parses a .pcap or .pcapng file (using only Python stdlib + scapy)
    and produces a threat-intelligence-style summary report:
      - Protocol breakdown
      - Top talkers (src/dst IP pairs)
      - Suspicious port activity (known malware ports)
      - Cleartext credential indicators (FTP/Telnet/HTTP Basic)
      - DNS query log
      - Optional CSV export per category

Usage:
    python pcap_analyzer.py --file capture.pcap --output report/
    python pcap_analyzer.py --file capture.pcap --summary-only

Dependencies:
    pip install scapy
"""

import argparse
import csv
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime

try:
    from scapy.all import rdpcap, IP, TCP, UDP, ICMP, DNS, DNSQR, Raw
    from scapy.layers.http import HTTPRequest
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

# ── Known suspicious ports ────────────────────────────────────────────────────
SUSPICIOUS_PORTS = {
    4444: "Metasploit default",
    1337: "Common backdoor",
    31337: "Back Orifice",
    6667: "IRC (C2 channel)",
    6666: "IRC / Alt C2",
    12345: "NetBus RAT",
    9001: "Tor relay",
    9050: "Tor SOCKS proxy",
    23:   "Telnet (cleartext)",
    21:   "FTP (cleartext)",
}

CLEARTEXT_PORTS = {21, 23, 80}  # FTP, Telnet, HTTP


def analyze_pcap(filepath: str) -> dict:
    """Read and analyze a PCAP file. Returns structured findings dict."""
    if not SCAPY_AVAILABLE:
        print("[!] scapy not installed. Run: pip install scapy")
        sys.exit(1)

    print(f"[*] Loading packets from: {filepath}")
    packets = rdpcap(filepath)
    print(f"[*] Loaded {len(packets)} packets\n")

    findings = {
        "total_packets": len(packets),
        "protocols": Counter(),
        "top_talkers": Counter(),
        "suspicious_connections": [],
        "cleartext_indicators": [],
        "dns_queries": [],
        "port_activity": Counter(),
        "packet_sizes": [],
    }

    for pkt in packets:
        # Protocol tally
        if pkt.haslayer(TCP):   findings["protocols"]["TCP"] += 1
        if pkt.haslayer(UDP):   findings["protocols"]["UDP"] += 1
        if pkt.haslayer(ICMP):  findings["protocols"]["ICMP"] += 1

        if not pkt.haslayer(IP):
            continue

        src_ip = pkt[IP].src
        dst_ip = pkt[IP].dst
        pair   = f"{src_ip} → {dst_ip}"
        findings["top_talkers"][pair] += 1
        findings["packet_sizes"].append(len(pkt))

        # Port-level analysis
        if pkt.haslayer(TCP):
            dport = pkt[TCP].dport
            sport = pkt[TCP].sport
            findings["port_activity"][dport] += 1

            # Flag suspicious destination ports
            if dport in SUSPICIOUS_PORTS:
                findings["suspicious_connections"].append({
                    "src": src_ip, "dst": dst_ip,
                    "port": dport, "reason": SUSPICIOUS_PORTS[dport],
                })

            # Cleartext credential detection (heuristic)
            if dport in CLEARTEXT_PORTS and pkt.haslayer(Raw):
                payload = bytes(pkt[Raw].load)
                indicators = [b"USER ", b"PASS ", b"Authorization: Basic", b"login", b"password"]
                for ind in indicators:
                    if ind.lower() in payload.lower():
                        findings["cleartext_indicators"].append({
                            "src": src_ip, "dst": dst_ip,
                            "port": dport,
                            "indicator": ind.decode(errors="replace").strip(),
                        })
                        break

        # DNS query extraction
        if pkt.haslayer(DNS) and pkt[DNS].qr == 0 and pkt.haslayer(DNSQR):
            query = pkt[DNSQR].qname.decode(errors="replace").rstrip(".")
            findings["dns_queries"].append({"src": src_ip, "query": query})

    return findings


def print_summary(findings: dict):
    """Print a human-readable threat summary to stdout."""
    sep = "─" * 60
    print(f"\n{'='*60}")
    print("  PCAP Analysis Report | Anthony Smith — Security Portfolio")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    print(f"Total packets analyzed: {findings['total_packets']}")

    if findings["packet_sizes"]:
        avg = sum(findings["packet_sizes"]) / len(findings["packet_sizes"])
        print(f"Avg packet size:        {avg:.1f} bytes")

    print(f"\n{sep}\nPROTOCOL BREAKDOWN\n{sep}")
    for proto, count in findings["protocols"].most_common():
        bar = "█" * min(40, count // max(1, findings["total_packets"] // 40))
        print(f"  {proto:<8} {count:>6}  {bar}")

    print(f"\n{sep}\nTOP 10 TALKERS\n{sep}")
    for pair, count in findings["top_talkers"].most_common(10):
        print(f"  {count:>5} pkts  {pair}")

    print(f"\n{sep}\nSUSPICIOUS CONNECTIONS ({len(findings['suspicious_connections'])} found)\n{sep}")
    if findings["suspicious_connections"]:
        for entry in findings["suspicious_connections"][:20]:
            print(f"  [!] {entry['src']} → {entry['dst']}:{entry['port']} — {entry['reason']}")
    else:
        print("  None detected.")

    print(f"\n{sep}\nCLEARTEXT CREDENTIAL INDICATORS ({len(findings['cleartext_indicators'])} found)\n{sep}")
    if findings["cleartext_indicators"]:
        for entry in findings["cleartext_indicators"][:10]:
            print(f"  [!] {entry['src']} → {entry['dst']}:{entry['port']} | keyword: '{entry['indicator']}'")
    else:
        print("  None detected.")

    print(f"\n{sep}\nDNS QUERIES (first 20)\n{sep}")
    for q in findings["dns_queries"][:20]:
        print(f"  {q['src']:<18} queried: {q['query']}")

    print()


def export_csv(findings: dict, output_dir: str):
    """Export each category to its own CSV in output_dir."""
    os.makedirs(output_dir, exist_ok=True)

    # Top talkers
    with open(os.path.join(output_dir, "top_talkers.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["flow", "packet_count"])
        w.writeheader()
        for pair, count in findings["top_talkers"].most_common(50):
            w.writerow({"flow": pair, "packet_count": count})

    # Suspicious connections
    with open(os.path.join(output_dir, "suspicious_connections.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["src", "dst", "port", "reason"])
        w.writeheader()
        w.writerows(findings["suspicious_connections"])

    # Cleartext indicators
    with open(os.path.join(output_dir, "cleartext_indicators.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["src", "dst", "port", "indicator"])
        w.writeheader()
        w.writerows(findings["cleartext_indicators"])

    # DNS queries
    with open(os.path.join(output_dir, "dns_queries.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["src", "query"])
        w.writeheader()
        w.writerows(findings["dns_queries"])

    print(f"[+] CSV reports saved to: {output_dir}/")


def main():
    parser = argparse.ArgumentParser(
        description="PCAP Analyzer — Anthony Smith Security Portfolio",
        epilog="Example:\n  python pcap_analyzer.py --file capture.pcap --output ./report",
    )
    parser.add_argument("--file",         required=True, help="Path to .pcap or .pcapng file")
    parser.add_argument("--output",       default=None,  help="Directory to save CSV reports")
    parser.add_argument("--summary-only", action="store_true", help="Print summary only, skip CSV export")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"[!] File not found: {args.file}")
        sys.exit(1)

    findings = analyze_pcap(args.file)
    print_summary(findings)

    if not args.summary_only and args.output:
        export_csv(findings, args.output)


if __name__ == "__main__":
    main()
