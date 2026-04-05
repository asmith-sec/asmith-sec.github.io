#!/usr/bin/env python3
"""
network_baseline.py — Network Baseline & Anomaly Detector
Author: Anthony Smith | Junior Security Engineer Portfolio
Description:
    Builds a network baseline from a reference PCAP (or a JSON snapshot)
    and compares a second PCAP against it to highlight anomalies:
      - New hosts that didn't exist in the baseline
      - New open ports per host
      - Unusual protocol shifts
      - Traffic volume spikes (per-host byte delta)

    Useful for post-incident analysis: "What changed since last week's snapshot?"

Usage:
    # Build baseline from a PCAP
    python network_baseline.py --mode baseline --pcap baseline.pcap --save baseline.json

    # Compare a new capture against saved baseline
    python network_baseline.py --mode compare --pcap current.pcap --baseline baseline.json

    # Run demo mode (generates synthetic data for testing without a real PCAP)
    python network_baseline.py --mode demo

Dependencies:
    pip install scapy          (for live PCAP parsing)
    Python 3.8+ stdlib only    (for demo / JSON baseline mode)
"""

import argparse
import json
import os
import sys
import random
from collections import defaultdict
from datetime import datetime


# ── Scapy optional import ────────────────────────────────────────────────────
try:
    from scapy.all import rdpcap, IP, TCP, UDP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False


def pcap_to_snapshot(filepath: str) -> dict:
    """Parse a PCAP and return a network snapshot dict."""
    if not SCAPY_AVAILABLE:
        print("[!] scapy required for PCAP parsing: pip install scapy")
        sys.exit(1)

    packets  = rdpcap(filepath)
    hosts    = defaultdict(lambda: {"ports": set(), "protocols": set(), "bytes": 0})

    for pkt in packets:
        if not pkt.haslayer(IP):
            continue
        src = pkt[IP].src
        dst = pkt[IP].dst
        size = len(pkt)

        hosts[src]["bytes"] += size
        hosts[dst]["bytes"] += size

        if pkt.haslayer(TCP):
            hosts[dst]["ports"].add(pkt[TCP].dport)
            hosts[src]["protocols"].add("TCP")
            hosts[dst]["protocols"].add("TCP")
        if pkt.haslayer(UDP):
            hosts[dst]["ports"].add(pkt[UDP].dport)
            hosts[src]["protocols"].add("UDP")
            hosts[dst]["protocols"].add("UDP")

    # Convert sets to sorted lists for JSON serialization
    snapshot = {
        "generated": datetime.now().isoformat(),
        "source":    filepath,
        "hosts": {
            ip: {
                "ports":     sorted(data["ports"]),
                "protocols": sorted(data["protocols"]),
                "bytes":     data["bytes"],
            }
            for ip, data in hosts.items()
        },
    }
    return snapshot


def generate_demo_snapshot(label: str, shift: bool = False) -> dict:
    """Generate a synthetic network snapshot for demo/testing purposes."""
    base_hosts = {
        "192.168.1.1":  {"ports": [22, 80, 443],        "protocols": ["TCP"], "bytes": 50000},
        "192.168.1.10": {"ports": [22, 3389],            "protocols": ["TCP"], "bytes": 120000},
        "192.168.1.20": {"ports": [80, 443, 8080],       "protocols": ["TCP", "UDP"], "bytes": 75000},
        "192.168.1.50": {"ports": [21, 22],              "protocols": ["TCP"], "bytes": 30000},
    }
    if shift:
        # Simulate anomalies: new host, new port on existing host, traffic spike
        base_hosts["192.168.1.99"] = {"ports": [4444, 8888], "protocols": ["TCP"], "bytes": 200000}
        base_hosts["192.168.1.10"]["ports"].append(4444)      # Metasploit port!
        base_hosts["192.168.1.10"]["bytes"] = 900000           # Spike
        base_hosts["192.168.1.1"]["ports"].append(23)          # Telnet appeared
    return {"generated": datetime.now().isoformat(), "source": label, "hosts": base_hosts}


def compare_snapshots(baseline: dict, current: dict) -> dict:
    """Diff two snapshots and return anomaly findings."""
    base_hosts = baseline.get("hosts", {})
    curr_hosts = current.get("hosts",  {})

    anomalies = {
        "new_hosts":   [],
        "gone_hosts":  [],
        "new_ports":   [],
        "port_closed": [],
        "traffic_spikes": [],
        "new_protocols": [],
    }

    # New hosts
    for ip in curr_hosts:
        if ip not in base_hosts:
            anomalies["new_hosts"].append({
                "ip": ip, "ports": curr_hosts[ip]["ports"],
                "bytes": curr_hosts[ip]["bytes"],
            })

    # Gone hosts
    for ip in base_hosts:
        if ip not in curr_hosts:
            anomalies["gone_hosts"].append(ip)

    # Per-host diffs
    for ip in curr_hosts:
        if ip not in base_hosts:
            continue
        base = base_hosts[ip]
        curr = curr_hosts[ip]

        # New open ports
        new_p = set(curr["ports"]) - set(base["ports"])
        if new_p:
            anomalies["new_ports"].append({"ip": ip, "ports": sorted(new_p)})

        # Closed ports
        closed_p = set(base["ports"]) - set(curr["ports"])
        if closed_p:
            anomalies["port_closed"].append({"ip": ip, "ports": sorted(closed_p)})

        # Traffic spike (>3x baseline)
        if base["bytes"] > 0 and curr["bytes"] > base["bytes"] * 3:
            anomalies["traffic_spikes"].append({
                "ip": ip,
                "baseline_bytes": base["bytes"],
                "current_bytes":  curr["bytes"],
                "multiplier":     round(curr["bytes"] / base["bytes"], 1),
            })

        # New protocols
        new_proto = set(curr["protocols"]) - set(base["protocols"])
        if new_proto:
            anomalies["new_protocols"].append({"ip": ip, "protocols": sorted(new_proto)})

    return anomalies


def print_anomalies(anomalies: dict):
    """Print structured anomaly report."""
    sep = "─" * 60
    print(f"\n{'='*60}")
    print("  Network Baseline Anomaly Report | Anthony Smith")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    # New hosts
    print(f"{sep}\n🔴 NEW HOSTS DETECTED ({len(anomalies['new_hosts'])})\n{sep}")
    if anomalies["new_hosts"]:
        for h in anomalies["new_hosts"]:
            print(f"  [NEW] {h['ip']:<20} ports={h['ports']}  bytes={h['bytes']:,}")
    else:
        print("  None.")

    # New ports
    print(f"\n{sep}\n🟠 NEW OPEN PORTS ON EXISTING HOSTS ({len(anomalies['new_ports'])})\n{sep}")
    if anomalies["new_ports"]:
        for p in anomalies["new_ports"]:
            print(f"  [!] {p['ip']:<20} new ports: {p['ports']}")
    else:
        print("  None.")

    # Traffic spikes
    print(f"\n{sep}\n🟡 TRAFFIC VOLUME SPIKES ({len(anomalies['traffic_spikes'])})\n{sep}")
    if anomalies["traffic_spikes"]:
        for s in anomalies["traffic_spikes"]:
            print(f"  [!] {s['ip']:<20} {s['multiplier']}x increase "
                  f"({s['baseline_bytes']:,} → {s['current_bytes']:,} bytes)")
    else:
        print("  None.")

    # Gone hosts
    if anomalies["gone_hosts"]:
        print(f"\n{sep}\n⬜ HOSTS NO LONGER VISIBLE ({len(anomalies['gone_hosts'])})\n{sep}")
        for ip in anomalies["gone_hosts"]:
            print(f"  [-] {ip}")

    print()


def main():
    parser = argparse.ArgumentParser(
        description="Network Baseline & Anomaly Detector — Anthony Smith",
        epilog="Modes:\n"
               "  baseline: build JSON snapshot from PCAP\n"
               "  compare:  diff current PCAP against saved baseline\n"
               "  demo:     run with synthetic data (no PCAP required)",
    )
    parser.add_argument("--mode",     required=True, choices=["baseline", "compare", "demo"])
    parser.add_argument("--pcap",     default=None,  help="Path to PCAP file")
    parser.add_argument("--baseline", default=None,  help="Path to saved baseline JSON")
    parser.add_argument("--save",     default=None,  help="Save baseline snapshot to JSON path")
    args = parser.parse_args()

    if args.mode == "demo":
        print("[*] Running in DEMO mode — using synthetic network data\n")
        baseline = generate_demo_snapshot("baseline_week1.pcap", shift=False)
        current  = generate_demo_snapshot("current_capture.pcap", shift=True)
        anomalies = compare_snapshots(baseline, current)
        print_anomalies(anomalies)
        return

    if args.mode == "baseline":
        if not args.pcap:
            print("[!] --pcap required for baseline mode")
            sys.exit(1)
        snapshot = pcap_to_snapshot(args.pcap)
        save_path = args.save or "baseline.json"
        with open(save_path, "w") as f:
            json.dump(snapshot, f, indent=2)
        print(f"[+] Baseline saved to: {save_path}")
        print(f"    Hosts captured: {len(snapshot['hosts'])}")

    elif args.mode == "compare":
        if not args.pcap or not args.baseline:
            print("[!] --pcap and --baseline both required for compare mode")
            sys.exit(1)
        current = pcap_to_snapshot(args.pcap)
        with open(args.baseline) as f:
            baseline = json.load(f)
        anomalies = compare_snapshots(baseline, current)
        print_anomalies(anomalies)


if __name__ == "__main__":
    main()
