"""
Builds data/urls.csv from:
  - data/phishing_urls.txt  (downloaded — 789k phishing URLs)
  - Hardcoded list of well-known legitimate domains (top 500 Alexa-class)

Output: data/urls.csv with columns: url, label  (0=legit, 1=phishing)
"""
import csv, random, os

LEGIT_DOMAINS = [
    "google.com","youtube.com","facebook.com","twitter.com","instagram.com",
    "linkedin.com","wikipedia.org","reddit.com","amazon.com","yahoo.com",
    "bing.com","microsoft.com","apple.com","github.com","stackoverflow.com",
    "netflix.com","twitch.tv","ebay.com","paypal.com","dropbox.com",
    "spotify.com","pinterest.com","tumblr.com","wordpress.com","blogger.com",
    "adobe.com","salesforce.com","zoom.us","slack.com","trello.com",
    "shopify.com","etsy.com","airbnb.com","booking.com","expedia.com",
    "tripadvisor.com","yelp.com","imdb.com","weather.com","cnn.com",
    "bbc.com","nytimes.com","theguardian.com","forbes.com","techcrunch.com",
    "wired.com","medium.com","quora.com","duolingo.com","coursera.org",
    "udemy.com","khanacademy.org","edx.org","mit.edu","harvard.edu",
    "stanford.edu","berkeley.edu","nist.gov","nasa.gov","cdc.gov",
    "who.int","un.org","europa.eu","gov.uk","canada.ca",
    "cloudflare.com","aws.amazon.com","azure.microsoft.com","heroku.com","vercel.com",
    "stripe.com","twilio.com","sendgrid.com","mailchimp.com","hubspot.com",
    "notion.so","airtable.com","figma.com","canva.com","asana.com",
    "jira.atlassian.com","confluence.atlassian.com","gitlab.com","bitbucket.org","npm.js",
    "npmjs.com","pypi.org","rubygems.org","packagist.org","nuget.org",
    "docker.com","kubernetes.io","terraform.io","ansible.com","jenkins.io",
    "nginx.com","apache.org","mysql.com","postgresql.org","mongodb.com",
    "redis.io","elasticsearch.co","grafana.com","prometheus.io","kibana.io",
    "brave.com","opera.com","mozilla.org","chrome.google.com","safari.com",
    "protonmail.com","tutanota.com","fastmail.com","gmail.com","outlook.com",
    "office.com","onedrive.live.com","icloud.com","box.com","mega.nz",
    "vimeo.com","dailymotion.com","tiktok.com","snapchat.com","discord.com",
    "telegram.org","signal.org","whatsapp.com","skype.com","facetime.apple.com",
    "chase.com","bankofamerica.com","wellsfargo.com","citibank.com","hsbc.com",
    "barclays.co.uk","santander.com","ing.com","schwab.com","fidelity.com",
    "coinbase.com","binance.com","kraken.com","robinhood.com","etrade.com",
    "bloomberg.com","reuters.com","wsj.com","ft.com","economist.com",
    "nature.com","science.org","pubmed.ncbi.nlm.nih.gov","scholar.google.com","researchgate.net",
    "walmart.com","target.com","costco.com","bestbuy.com","homedepot.com",
    "ikea.com","zara.com","hm.com","uniqlo.com","nike.com",
    "adidas.com","samsung.com","lg.com","sony.com","philips.com",
    "dell.com","hp.com","lenovo.com","asus.com","acer.com",
]

PATHS = [
    "/", "/home", "/about", "/contact", "/products", "/services",
    "/blog", "/news", "/faq", "/help", "/support", "/pricing",
    "/signup", "/search?q=test", "/article/how-to-stay-safe",
]

def make_legit_url(domain):
    scheme = "https"
    path = random.choice(PATHS)
    subdomain = random.choice(["", "www.", "www."])
    return f"{scheme}://{subdomain}{domain}{path}"

def load_phishing(path, limit=100000):
    urls = []
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and line.startswith("http"):
                urls.append(line)
            if len(urls) >= limit:
                break
    return urls

def main():
    os.makedirs("data", exist_ok=True)
    print("Loading phishing URLs...")
    phishing = load_phishing("data/phishing_urls.txt", limit=100000)
    random.shuffle(phishing)
    phishing = phishing[:50000]
    print(f"  Using {len(phishing)} phishing URLs")

    print("Generating legitimate URLs...")
    legit = []
    while len(legit) < 50000:
        domain = random.choice(LEGIT_DOMAINS)
        legit.append(make_legit_url(domain))
    print(f"  Generated {len(legit)} legitimate URLs")

    rows = [(u, 1) for u in phishing] + [(u, 0) for u in legit]
    random.shuffle(rows)

    out_path = "data/urls.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["url", "label"])
        writer.writerows(rows)

    print(f"\nDataset saved to {out_path}")
    print(f"Total rows: {len(rows)}  |  Phishing: {len(phishing)}  |  Legit: {len(legit)}")

if __name__ == "__main__":
    main()
