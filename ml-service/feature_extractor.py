"""
Feature extractor for phishing URL classification.
Extracts numerical features from a URL string without making network requests.
"""
import re
from urllib.parse import urlparse
from typing import Dict, Any


SUSPICIOUS_KEYWORDS = ['login', 'verify', 'update', 'secure', 'account', 'signin', 'banking', 'password']
SUSPICIOUS_TLDS = {'.xyz', '.tk', '.top', '.gq', '.ml', '.cf', '.ga'}
KNOWN_BRANDS = ['google', 'paypal', 'microsoft', 'amazon', 'apple', 'facebook', 'netflix']
IP_REGEX = re.compile(r'^(\d{1,3}\.){3}\d{1,3}$')


def extract_features(url: str) -> Dict[str, Any]:
    """Return a flat dict of numerical features for the ML model."""
    features: Dict[str, Any] = {}

    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ''
        path = parsed.path or ''
    except Exception:
        # Return worst-case features for unparseable URLs
        return {k: 1 for k in _feature_names()}

    # Basic URL properties
    features['url_length'] = len(url)
    features['hostname_length'] = len(hostname)
    features['path_length'] = len(path)
    features['num_dots'] = url.count('.')
    features['num_hyphens'] = url.count('-')
    features['num_underscores'] = url.count('_')
    features['num_slashes'] = url.count('/')
    features['num_question_marks'] = url.count('?')
    features['num_equals'] = url.count('=')
    features['num_at'] = url.count('@')
    features['num_percent'] = url.count('%')
    features['num_ampersand'] = url.count('&')

    # Boolean flags (stored as 0/1)
    features['has_ip'] = int(bool(IP_REGEX.match(hostname)))
    features['is_https'] = int(parsed.scheme == 'https')
    features['has_www'] = int(hostname.startswith('www.'))
    features['has_encoded_chars'] = int(bool(re.search(r'%[0-9a-fA-F]{2}', url)))

    # Suspicious keyword count
    url_lower = url.lower()
    features['suspicious_keyword_count'] = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower)

    # Suspicious TLD
    tld = '.' + hostname.split('.')[-1] if '.' in hostname else ''
    features['has_suspicious_tld'] = int(tld in SUSPICIOUS_TLDS)

    # Subdomain count (dots in hostname minus 1 for the registered domain)
    features['subdomain_count'] = max(0, hostname.count('.') - 1)

    # Brand impersonation (minimum Levenshtein-like: simple substring check here)
    domain_base = hostname.replace('www.', '').split('.')[0]
    features['brand_impersonation'] = int(any(brand in domain_base for brand in KNOWN_BRANDS))

    return features


def _feature_names():
    return [
        'url_length', 'hostname_length', 'path_length', 'num_dots', 'num_hyphens',
        'num_underscores', 'num_slashes', 'num_question_marks', 'num_equals',
        'num_at', 'num_percent', 'num_ampersand', 'has_ip', 'is_https', 'has_www',
        'has_encoded_chars', 'suspicious_keyword_count', 'has_suspicious_tld',
        'subdomain_count', 'brand_impersonation',
    ]


def feature_vector(url: str) -> list:
    """Return features as an ordered list matching FEATURE_NAMES."""
    f = extract_features(url)
    return [f.get(name, 0) for name in _feature_names()]


FEATURE_NAMES = _feature_names()
