#!/usr/bin/env python3
"""
port_scanner.py — TCP Port Scanner
Author: Anthony Smith | Junior Security Engineer Portfolio
Description:
    Scans a target host for open TCP ports using socket connections.
    Supports single targets or CIDR ranges (requires 'ipaddress' stdlib).
    Outputs results to console and optionally to a CSV report.

Usage:
    python port_scanner.py --target 192.168.1.1 --ports 1-1024 --output scan_results.csv
    python port_scanner.py --target 10.0.0.0/24 --ports 22,80,443,8080

Dependencies: Python 3.8+ (stdlib only — no pip installs required)
"""

import socket
import argparse
import csv
import ipaddress
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# ── Configuration ────────────────────────────────────────────────────────────
DEFAULT_TIMEOUT   = 0.75   # seconds per connection attempt
DEFAULT_MAX_WORKERS = 100  # concurrent threads
COMMON_PORTS = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 135: "RPC", 139: "NetBIOS", 143: "IMAP",
    443: "HTTPS", 445: "SMB", 993: "IMAPS", 995: "POP3S",
    1433: "MSSQL", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
    5900: "VNC", 6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt",
    27017: "MongoDB",
}


def parse_ports(port_arg: str) -> list[int]:
    """Parse port string like '22,80,443' or '1-1024' into a list of ints."""
    ports = []
    for part in port_arg.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            ports.extend(range(int(start), int(end) + 1))
        else:
            ports.append(int(part))
    return sorted(set(ports))


def scan_port(host: str, port: int, timeout: float) -> dict:
    """Attempt a TCP connection to host:port. Returns result dict."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            service = COMMON_PORTS.get(port, "unknown")
            return {"host": host, "port": port, "state": "open", "service": service}
    except (socket.timeout, ConnectionRefusedError, OSError):
        return {"host": host, "port": port, "state": "closed", "service": ""}


def resolve_hosts(target: str) -> list[str]:
    """Expand target to a list of IP address strings (handles CIDR notation)."""
    try:
        network = ipaddress.ip_network(target, strict=False)
        return [str(ip) for ip in network.hosts()] if network.num_addresses > 1 else [str(network.network_address)]
    except ValueError:
        # Treat as hostname
        return [target]


def run_scan(targets: list[str], ports: list[int], timeout: float, max_workers: int) -> list[dict]:
    """Run threaded port scan across all targets and ports."""
    tasks = [(host, port) for host in targets for port in ports]
    results = []

    print(f"\n[*] Scanning {len(targets)} host(s), {len(ports)} port(s) — {len(tasks)} total checks")
    print(f"[*] Threads: {max_workers}  |  Timeout: {timeout}s\n")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(scan_port, host, port, timeout): (host, port)
                   for host, port in tasks}
        for future in as_completed(futures):
            result = future.result()
            if result["state"] == "open":
                results.append(result)
                print(f"  [OPEN] {result['host']}:{result['port']}  ({result['service']})")

    return sorted(results, key=lambda r: (r["host"], r["port"]))


def write_csv(results: list[dict], output_path: str):
    """Write open port results to a CSV file."""
    fieldnames = ["host", "port", "state", "service"]
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    print(f"\n[+] Results saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="TCP Port Scanner — Anthony Smith Security Portfolio",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Examples:\n"
               "  python port_scanner.py --target 192.168.1.1 --ports 1-1024\n"
               "  python port_scanner.py --target 10.0.0.0/24 --ports 22,80,443 --output out.csv",
    )
    parser.add_argument("--target",   required=True,        help="Target IP, hostname, or CIDR range")
    parser.add_argument("--ports",    default="1-1024",     help="Port range (e.g. '1-1024' or '22,80,443')")
    parser.add_argument("--timeout",  type=float, default=DEFAULT_TIMEOUT, help="Connection timeout in seconds")
    parser.add_argument("--threads",  type=int,   default=DEFAULT_MAX_WORKERS, help="Max concurrent threads")
    parser.add_argument("--output",   default=None, help="CSV output file path (optional)")
    args = parser.parse_args()

    print("=" * 60)
    print("  TCP Port Scanner | Anthony Smith — Security Portfolio")
    print(f"  Scan started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    targets = resolve_hosts(args.target)
    ports   = parse_ports(args.ports)
    results = run_scan(targets, ports, args.timeout, args.threads)

    print(f"\n{'='*60}")
    print(f"  Scan complete — {len(results)} open port(s) found")
    print("=" * 60)

    if args.output:
        write_csv(results, args.output)


if __name__ == "__main__":
    main()
