from binance.client import Client
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import datetime
import argparse
import re

crypto_names = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "XRP": "Ripple",
    "LTC": "Litecoin",
    "BCH": "Bitcoin Cash",
    "DOGE": "Dogecoin",
    "ADA": "Cardano",
    "SOL": "Solana",
}

parser = argparse.ArgumentParser(description="Plot crypto price chart")

parser.add_argument("--symbol", type=str, default="BTCUSDT", help="Crypto symbol to plot", required=True)
parser.add_argument("--theme", choices=["light", "dark"], default="light")
parser.add_argument("--output", type=str, help="File path to save the chart (e.g. ./chart.png)")

args = parser.parse_args()

match = re.match(r"^([A-Z]+)USDT$", args.symbol)
if match:
    coin = match.group(1)
else:
    print("Symbol không hợp lệ. Format đúng: BTCUSDT, ETHUSDT, ...")
    exit(1)

if coin not in crypto_names:
    print(f"Symbol '{args.symbol}' không hợp lệ. Hãy thử lại với 1 trong: {', '.join(crypto_names.keys())}USDT")
    exit(1)

crypto_symbol = args.symbol[:3] 

crypto_name = crypto_names.get(crypto_symbol, crypto_symbol)

client = Client()

candles = client.get_historical_klines(args.symbol, Client.KLINE_INTERVAL_5MINUTE, "12 hour ago UTC")

timestamp = [datetime.datetime.fromtimestamp(candle[0] / 1000.0) for candle in candles]
close_prices = [float(candle[4]) for candle in candles]

current_price = close_prices[-1]
line_color = "cyan" if args.theme == "dark" else "blue"

if args.theme == "dark":
    plt.style.use("dark_background")
    text_color = "white"
else:
    plt.style.use("default")
    text_color = "black"

plt.figure(figsize=(12, 6))

plt.plot(timestamp, close_prices, label=f"{args.symbol}", color=line_color)

plt.scatter(timestamp[-1], close_prices[-1], color='red', zorder=5)

plt.text(0, 1.05, f"{args.symbol[:3]}/{crypto_name}",
         ha='left', va='bottom', fontsize=16, fontweight='bold',
         color=text_color, transform=plt.gca().transAxes)

plt.text(1, 1.05, f"${current_price:,.2f}",
         ha='right', va='bottom', fontsize=16, fontweight='bold',
         color=text_color, transform=plt.gca().transAxes)

plt.grid(True)
plt.legend()
plt.subplots_adjust(top=0.85, bottom=0.15, left=0.1, right=0.9)
plt.tight_layout()
plt.gcf().autofmt_xdate()
plt.gca().xaxis.set_major_locator(mdates.MinuteLocator(interval=50))
plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))

filename = args.output if args.output else f"{args.symbol}_price_chart.png"
plt.savefig(filename, bbox_inches='tight', dpi=300)