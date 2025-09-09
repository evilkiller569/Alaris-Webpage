Alaris AI

Alaris AI is a health-tech platform focused on early detection and prevention of critical health events. The system integrates biosensors, machine learning, and user-centric design to provide real-time health insights and personalized early-warning alerts.

Mission

To empower individuals with proactive healthcare insights by combining wearable biosensors with advanced AI models, ultimately reducing preventable emergencies and improving quality of life.

Features

Biosensor Integration: Support for glucose monitors, ECG/heart-rate sensors, HRV trackers, skin temperature, EDA, and SpO₂ devices.

AI/ML Pipeline: Logistic regression, anomaly detection, and predictive modeling for early event detection.

Unified Dashboard: Real-time visualization of key biomarkers with personalized thresholds.

Proactive Alerts: Notifications for at-risk events such as hypoglycemia and cardiac irregularities.

Expandable Platform: Modular design for integrating new sensors and algorithms.

System Architecture

Hardware Layer: Wearables (Polar H10, CGMs, HR monitors, etc.)

Data Processing Layer: Signal cleaning, normalization, and feature extraction

AI Models: Logistic regression, anomaly detection, predictive algorithms

Application Layer: User dashboard and clinician portal

Tech Stack

Hardware: Polar H10, CGMs, additional biosensors

Software: Python, TensorFlow/PyTorch, SQL, REST APIs

Infrastructure: Cloud deployment (Azure/AWS), secure data storage

Security: HIPAA-compliant encryption for sensitive health data

Team

Abraham Nakhal — Founder & CEO / Biology Lead

Aayush Roy — AI/CS Lead

Kanishk Murthy — Hardware Lead

Roadmap

Phase 1: Prototype development with biosensor integration (HR, glucose, HRV)

Phase 2: AI model testing for anomaly detection and predictive alerts

Phase 3: User app and clinician dashboard

Phase 4: Clinical testing and validation partnerships

Compliance & Ethics

HIPAA-compliant data handling

Transparent AI predictions

Patient safety and ethical AI design as core values

Getting Started

Clone the repository:

git clone https://github.com/alaris-ai/alaris-ai.git
cd alaris-ai


Install dependencies:

pip install -r requirements.txt


Connect biosensors (Polar H10, CGM, etc.)

Run the pipeline:

python main.py

Contributing

We welcome contributions from researchers, engineers, and healthcare professionals. Please submit pull requests or open an issue for discussion.

License

This project is licensed under the MIT License. See the LICENSE file for details.
