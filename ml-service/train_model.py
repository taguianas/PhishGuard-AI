"""
Model training script.
Usage:
  1. Download a phishing URL dataset (e.g. from Kaggle) as 'data/urls.csv'
     Expected columns: 'url' (string), 'label' (0=legit, 1=phishing)
  2. Run: python train_model.py
  3. Model saved to model.pkl
"""
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from xgboost import XGBClassifier
from feature_extractor import feature_vector, FEATURE_NAMES

DATA_PATH = 'data/urls.csv'
MODEL_PATH = 'model.pkl'


def load_data(path: str):
    df = pd.read_csv(path)
    assert 'url' in df.columns and 'label' in df.columns, \
        "CSV must have 'url' and 'label' columns"
    print(f"Loaded {len(df)} rows. Label distribution:\n{df['label'].value_counts()}")
    return df


def build_features(df: pd.DataFrame):
    X = [feature_vector(url) for url in df['url']]
    y = df['label'].astype(int).tolist()
    return X, y


def train(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Try XGBoost first, fall back to RandomForest
    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric='logloss',
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing']))

    return model


if __name__ == '__main__':
    df = load_data(DATA_PATH)
    X, y = build_features(df)
    model = train(X, y)
    joblib.dump({'model': model, 'features': FEATURE_NAMES}, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")
