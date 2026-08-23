"""Clinical Red-Flag Rules Configuration for HealthAssist Safety Engine.

Defines auditable, evidence-based red-flag rule sets grounded in authoritative
clinical triage and emergency guidelines:
- Emergency Severity Index (ESI) Implementation Handbook (AHRQ)
- American Heart Association / American College of Cardiology (AHA/ACC) ACS Guidelines
- National Institute for Health and Care Excellence (NICE) Stroke and Sepsis Guidelines
- CDC / WHO Acute Respiratory Distress & Infectious Triage Protocols

RULES ARE ISOLATED HERE TO ENABLE CLINICAL REVIEW, AUDITING, AND UPDATES.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass(frozen=True)
class SafetyRule:
    """Represents an isolated, auditable clinical safety rule."""
    rule_id: str
    name: str
    category: str
    target_severity: str  # 'EMERGENCY' or 'HIGH'
    keywords: List[str]
    description: str
    clinical_guideline: str
    action_directive: str
    requires_safety_override: bool = True


# ==============================================================================
# AUTHORITATIVE CLINICAL RED-FLAG RULE DEFINITIONS
# ==============================================================================

CARDIOVASCULAR_EMERGENCY_RULES: List[SafetyRule] = [
    SafetyRule(
        rule_id="CARDIO-001",
        name="Acute Coronary Syndrome / Myocardial Infarction",
        category="Cardiovascular",
        target_severity="EMERGENCY",
        keywords=[
            "crushing chest pain",
            "severe chest pain",
            "chest pressure",
            "chest tightness with radiating pain",
            "pain radiating to left arm",
            "pain radiating to jaw",
            "substernal chest pain",
        ],
        description="Symptoms suggestive of acute myocardial ischemia or infarction.",
        clinical_guideline="AHA/ACC 2021 Chest Pain Evaluation Guidelines / ESI Level 2",
        action_directive="Immediate emergency medical evaluation (call 911 or visit Emergency Department). Do not drive yourself.",
        requires_safety_override=True,
    ),
    SafetyRule(
        rule_id="CARDIO-002",
        name="Acute Hemodynamic Instability / Syncope",
        category="Cardiovascular",
        target_severity="EMERGENCY",
        keywords=[
            "loss of consciousness",
            "unconscious",
            "passed out suddenly",
            "syncope with palpitations",
            "severe dizziness with chest pain",
        ],
        description="Transient or persistent loss of consciousness indicating possible cardiac syncope or hemodynamic collapse.",
        clinical_guideline="ESC/AHA Guidelines for the Evaluation and Management of Syncope",
        action_directive="Urgent emergency department assessment with ECG and continuous cardiac monitoring.",
        requires_safety_override=True,
    ),
]

RESPIRATORY_EMERGENCY_RULES: List[SafetyRule] = [
    SafetyRule(
        rule_id="RESP-001",
        name="Severe Acute Respiratory Distress",
        category="Respiratory",
        target_severity="EMERGENCY",
        keywords=[
            "severe shortness of breath",
            "difficulty breathing",
            "unable to breathe",
            "gasping for air",
            "cyanosis",
            "blue lips",
            "blue fingernails",
            "respiratory distress",
        ],
        description="Acute respiratory failure or severe oxygenation compromise.",
        clinical_guideline="ESI Level 1/2 Airway and Breathing Compromise Protocols",
        action_directive="Immediate emergency intervention and supplemental oxygen / airway management.",
        requires_safety_override=True,
    ),
    SafetyRule(
        rule_id="RESP-002",
        name="Acute Airway Compromise / Anaphylaxis",
        category="Respiratory",
        target_severity="EMERGENCY",
        keywords=[
            "throat closing",
            "throat swelling",
            "unable to swallow",
            "inspiratory stridor",
            "stridor",
            "anaphylaxis",
            "swollen tongue with breathing difficulty",
        ],
        description="Upper airway obstruction or systemic anaphylaxis with impending airway compromise.",
        clinical_guideline="World Allergy Organization (WAO) Anaphylaxis Guidelines",
        action_directive="Emergency medical services call (911); administer intramuscular epinephrine if autoinjector is prescribed.",
        requires_safety_override=True,
    ),
    SafetyRule(
        rule_id="RESP-003",
        name="Hemoptysis",
        category="Respiratory",
        target_severity="EMERGENCY",
        keywords=[
            "coughing up blood",
            "coughing blood",
            "hemoptysis",
            "massive hemoptysis",
        ],
        description="Active respiratory tract hemorrhage (hemoptysis).",
        clinical_guideline="British Thoracic Society (BTS) Guideline on the Management of Hemoptysis",
        action_directive="Immediate in-person emergency evaluation for diagnostic chest imaging and airway stabilization.",
        requires_safety_override=True,
    ),
]

NEUROLOGICAL_EMERGENCY_RULES: List[SafetyRule] = [
    SafetyRule(
        rule_id="NEURO-001",
        name="Acute Stroke Symptoms (FAST Protocol)",
        category="Neurological",
        target_severity="EMERGENCY",
        keywords=[
            "sudden numbness",
            "facial droop",
            "face drooping",
            "slurred speech",
            "sudden weakness on one side",
            "arm weakness",
            "sudden inability to speak",
            "sudden vision loss",
            "hemiparesis",
        ],
        description="Focal neurological deficits indicative of acute ischemic stroke or intracranial hemorrhage.",
        clinical_guideline="AHA/ASA Early Management of Patients With Acute Ischemic Stroke / FAST",
        action_directive="Immediate emergency stroke code activation (call 911 immediately; time to thrombolysis is critical).",
        requires_safety_override=True,
    ),
    SafetyRule(
        rule_id="NEURO-002",
        name="Thunderclap Headache / Intracranial Hemorrhage",
        category="Neurological",
        target_severity="EMERGENCY",
        keywords=[
            "worst headache of my life",
            "thunderclap headache",
            "sudden severe explosive headache",
            "sudden severe headache peaking in seconds",
        ],
        description="Sudden, hyperacute maximal-intensity headache concerning for subarachnoid hemorrhage (SAH).",
        clinical_guideline="American College of Emergency Physicians (ACEP) Acute Headache Guidelines",
        action_directive="Immediate emergency transfer for urgent non-contrast head CT and neurovascular imaging.",
        requires_safety_override=True,
    ),
    SafetyRule(
        rule_id="NEURO-003",
        name="Meningeal Irritation / Acute Meningitis",
        category="Neurological",
        target_severity="EMERGENCY",
        keywords=[
            "stiff neck and fever",
            "neck stiffness and fever",
            "stiff neck with high fever",
            "meningismus",
            "severe headache with neck stiffness and fever",
        ],
        description="Classic triad of meningismus concerning for acute bacterial or viral meningitis.",
        clinical_guideline="IDSA Guidelines for the Management of Bacterial Meningitis",
        action_directive="Immediate emergency department evaluation for lumbar puncture and prompt empiric intravenous antimicrobial therapy.",
        requires_safety_override=True,
    ),
]

SURGICAL_TRAUMA_PSYCH_RULES: List[SafetyRule] = [
    SafetyRule(
        rule_id="TRAUMA-001",
        name="Uncontrolled Active Hemorrhage",
        category="Trauma/Surgical",
        target_severity="EMERGENCY",
        keywords=[
            "severe bleeding",
            "uncontrolled bleeding",
            "spurting blood",
            "massive hemorrhage",
            "arterial bleeding",
        ],
        description="Severe active blood loss with risk of hemorrhagic shock.",
        clinical_guideline="American College of Surgeons Committee on Trauma (ACS COT)",
        action_directive="Apply direct firm pressure with sterile gauze, call 911 immediately.",
        requires_safety_override=True,
    ),
    SafetyRule(
        rule_id="PSYCH-001",
        name="Acute Psychiatric Crisis / Suicidal Ideation",
        category="Psychiatric",
        target_severity="EMERGENCY",
        keywords=[
            "suicidal",
            "suicide",
            "want to end my life",
            "thoughts of hurting myself",
            "want to kill myself",
        ],
        description="Acute suicidal ideation or imminent self-harm risk.",
        clinical_guideline="APA Practice Guideline for the Assessment and Treatment of Patients With Suicidal Behaviors",
        action_directive="Connect immediately with the National Suicide & Crisis Lifeline (dial 988 in the US/Canada) or emergency services (911). Do not stay alone.",
        requires_safety_override=True,
    ),
]

# ==============================================================================
# URGENT / HIGH-SEVERITY CLINICAL RULES (Requiring Urgent Care Evaluation)
# ==============================================================================

URGENT_HIGH_SEVERITY_RULES: List[SafetyRule] = [
    SafetyRule(
        rule_id="URGENT-001",
        name="High Fever / Systemic Infection Risk",
        category="Infectious/Systemic",
        target_severity="HIGH",
        keywords=[
            "high fever",
            "fever above 102",
            "fever > 102",
            "fever over 39",
            "fever of 103",
            "fever of 104",
            "temperature 103",
            "temperature 104",
        ],
        description="Significantly elevated core body temperature indicating potentially severe systemic or focal infection.",
        clinical_guideline="IDSA / CDC Fever and Sepsis Clinical Triage",
        action_directive="Urgent medical consultation within 12-24 hours for clinical workup and antipyretic evaluation.",
        requires_safety_override=False,
    ),
    SafetyRule(
        rule_id="URGENT-002",
        name="Gastrointestinal Bleeding",
        category="Gastrointestinal",
        target_severity="HIGH",
        keywords=[
            "blood in stool",
            "black tarry stool",
            "melena",
            "coffee ground vomitus",
            "vomiting blood",
            "hematemesis",
        ],
        description="Evidence of upper or lower gastrointestinal tract bleeding.",
        clinical_guideline="ACG Clinical Guideline on Upper Gastrointestinal and Ulcer Bleeding",
        action_directive="Prompt urgent medical evaluation and endoscopic consultation.",
        requires_safety_override=False,
    ),
    SafetyRule(
        rule_id="URGENT-003",
        name="Intractable Vomiting / Severe Dehydration",
        category="Gastrointestinal",
        target_severity="HIGH",
        keywords=[
            "cannot keep fluids down",
            "unable to keep water down",
            "persistent vomiting",
            "severe dehydration",
            "vomiting for days without fluid retention",
        ],
        description="Persistent inability to maintain oral hydration with electrolyte derangement risk.",
        clinical_guideline="NICE Clinical Guideline on Diarrhoea and Vomiting in Adults",
        action_directive="Urgent clinical evaluation for antiemetic therapy and potential intravenous fluid rehydration.",
        requires_safety_override=False,
    ),
    SafetyRule(
        rule_id="URGENT-004",
        name="Acute Severe Abdominal Pain",
        category="Gastrointestinal/Surgical",
        target_severity="HIGH",
        keywords=[
            "severe abdominal pain",
            "acute severe belly pain",
            "severe right lower quadrant pain",
            "rebound tenderness in abdomen",
        ],
        description="Acute localized severe abdominal pain concerning for appendicitis, cholecystitis, or bowel obstruction.",
        clinical_guideline="WSES Guidelines on the Management of Acute Abdomen",
        action_directive="Urgent in-person surgical/clinical consultation with abdominal imaging and laboratory workup.",
        requires_safety_override=False,
    ),
]

# Consolidated master rule catalog
MASTER_SAFETY_RULES: List[SafetyRule] = (
    CARDIOVASCULAR_EMERGENCY_RULES
    + RESPIRATORY_EMERGENCY_RULES
    + NEUROLOGICAL_EMERGENCY_RULES
    + SURGICAL_TRAUMA_PSYCH_RULES
    + URGENT_HIGH_SEVERITY_RULES
)

# Common clinical negation prefixes to prevent false positives
NEGATION_PATTERNS: List[str] = [
    r"\bno\s+",
    r"\bnot\s+",
    r"\bdenies\s+",
    r"\bdenied\s+",
    r"\bwithout\s+",
    r"\bnegative\s+for\s+",
    r"\bno\s+history\s+of\s+",
    r"\bno\s+evidence\s+of\s+",
    r"\bfree\s+of\s+",
    r"\bruled\s+out\s+",
]
