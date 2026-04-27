export const CLINICAL_TEMPLATES = {
  presentingComplaint: {
    title: "Presenting Complaints",
    defaultCategory: "Pain",
    categories: {
      "Pain": [
        { label: "Toothache", value: "C/O persistent toothache." },
        { label: "Pain on biting", value: "C/O pain when eating or biting." },
        { label: "Sensitivity", value: "C/O sensitivity to hot and cold drinks." },
        { label: "Referred Pain", value: "C/O pain radiating to the ear/jaw." }
      ],
      "Swelling & Bleeding": [
        { label: "Facial Swelling", value: "C/O facial swelling." },
        { label: "Gum Swelling", value: "C/O localized gum swelling or 'boil'." },
        { label: "Bleeding Gums", value: "C/O bleeding gums, especially when brushing." }
      ],
      "Routine & Aesthetics": [
        { label: "Routine Checkup", value: "Came for a routine dental checkup." },
        { label: "Teeth Cleaning", value: "Requests scaling and polishing/teeth cleaning." },
        { label: "Teeth Whitening", value: "Requests teeth whitening." },
        { label: "Missing Teeth", value: "C/O missing teeth, desires replacement." }
      ],
      "Trauma & Damage": [
        { label: "Broken Tooth", value: "C/O broken or chipped tooth." },
        { label: "Lost Filling/Crown", value: "C/O dislodged filling or crown." },
        { label: "Trauma/Fall", value: "History of trauma/fall involving the face/teeth." }
      ]
    }
  },
  diagnosis: {
    title: "Diagnoses",
    defaultCategory: "Dental Caries & Pulpitis",
    categories: {
      "Dental Caries & Pulpitis": [
        { label: "Dental Caries", value: "Dental Caries" },
        { label: "Reversible Pulpitis", value: "Reversible Pulpitis" },
        { label: "Irreversible Pulpitis", value: "Irreversible Pulpitis" },
        { label: "Pulp Necrosis", value: "Pulp Necrosis" }
      ],
      "Periodontal Diseases": [
        { label: "Gingivitis", value: "Plaque-induced Gingivitis" },
        { label: "Chronic Periodontitis", value: "Chronic Periodontitis" },
        { label: "Periodontal Abscess", value: "Periodontal Abscess" },
        { label: "Gingival Recession", value: "Gingival Recession" }
      ],
      "Periapical Conditions": [
        { label: "Apical Periodontitis", value: "Symptomatic Apical Periodontitis" },
        { label: "Periapical Abscess", value: "Acute Periapical Abscess" },
        { label: "Periapical Granuloma/Cyst", value: "Periapical Granuloma" }
      ],
      "Other Conditions": [
        { label: "Impacted Tooth", value: "Tooth Impaction" },
        { label: "Retained Root", value: "Retained Root" },
        { label: "Tooth Fracture", value: "Tooth Fracture" },
        { label: "Alveolar Osteitis (Dry Socket)", value: "Alveolar Osteitis (Dry Socket)" }
      ]
    }
  },
  treatmentPlan: {
    title: "Treatment Plans",
    defaultCategory: "Restorative",
    categories: {
      "Restorative": [
        { label: "Composite Filling", value: "Composite Restoration" },
        { label: "Amalgam Filling", value: "Amalgam Restoration" },
        { label: "GIC Filling", value: "Glass Ionomer Cement (GIC) Restoration" },
        { label: "Crown placement", value: "Crown Preparation and Placement" }
      ],
      "Endodontics": [
        { label: "Root Canal Treatment", value: "Root Canal Treatment (RCT)" },
        { label: "Pulpotomy", value: "Pulpotomy" },
        { label: "Pulpectomy", value: "Pulpectomy" }
      ],
      "Surgery": [
        { label: "Routine Extraction", value: "Routine Tooth Extraction" },
        { label: "Surgical Extraction", value: "Surgical Tooth Extraction (Transalveolar)" },
        { label: "Impaction Surgery", value: "Surgical disimpaction" },
        { label: "Incision and Drainage", value: "Incision and Drainage (I&D)" }
      ],
      "Periodontics": [
        { label: "Scaling and Polishing", value: "Scaling and Polishing (S&P)" },
        { label: "Root Planing", value: "Root Planing" }
      ]
    }
  },
  allergies: {
    title: "Allergies",
    defaultCategory: "Medications",
    categories: {
      "Medications": [
        { label: "Penicillin", value: "Allergic to Penicillin" },
        { label: "Amoxicillin", value: "Allergic to Amoxicillin" },
        { label: "Erythromycin", value: "Allergic to Erythromycin" },
        { label: "Sulfa Drugs", value: "Allergic to Sulfa Drugs" },
        { label: "Aspirin/NSAIDs", value: "Allergic to Aspirin/NSAIDs" },
        { label: "Local Anesthetics", value: "Allergic to Local Anesthetics" },
        { label: "No Known Drug Allergies (NKDA)", value: "No Known Drug Allergies (NKDA)" }
      ],
      "Materials & Others": [
        { label: "Latex", value: "Allergic to Latex" },
        { label: "Acrylic", value: "Allergic to Acrylic" },
        { label: "Metals (Nickel/Chrome)", value: "Allergic to Metals (Nickel/Chrome)" },
        { label: "Epinephrine", value: "Adverse reaction to Epinephrine" }
      ]
    }
  },
  comorbidities: {
    title: "Comorbidities",
    defaultCategory: "Cardiovascular",
    categories: {
      "Cardiovascular": [
        { label: "Hypertension", value: "Hypertension" },
        { label: "Ischemic Heart Disease", value: "Ischemic Heart Disease" },
        { label: "Heart Murmur", value: "Heart Murmur" },
        { label: "Pacemaker", value: "Pacemaker present" }
      ],
      "Endocrine & Metabolic": [
        { label: "Diabetes Mellitus (Type 1)", value: "Diabetes Mellitus (Type 1)" },
        { label: "Diabetes Mellitus (Type 2)", value: "Diabetes Mellitus (Type 2)" },
        { label: "Hyperthyroidism", value: "Hyperthyroidism" },
        { label: "Hypothyroidism", value: "Hypothyroidism" }
      ],
      "Respiratory": [
        { label: "Asthma", value: "Asthma" },
        { label: "COPD", value: "Chronic Obstructive Pulmonary Disease (COPD)" },
        { label: "Tuberculosis (History)", value: "History of Tuberculosis" }
      ],
      "Other Conditions": [
        { label: "Epilepsy/Seizures", value: "Epilepsy/Seizure Disorder" },
        { label: "Bleeding Disorder", value: "Bleeding Disorder" },
        { label: "Hepatitis (B/C)", value: "Hepatitis (B/C)" },
        { label: "HIV/AIDS", value: "HIV/AIDS" },
        { label: "None", value: "No known comorbidities" }
      ]
    }
  },
  extraOral: {
    title: "Extra-Oral Examination",
    defaultCategory: "General Appearance",
    categories: {
      "General Appearance": [
        { label: "NAD", value: "NAD (No Abnormality Detected)." },
        { label: "Facial Asymmetry", value: "Facial asymmetry noted." },
        { label: "Swelling", value: "Extra-oral swelling present." }
      ],
      "TMJ & Muscles": [
        { label: "Normal TMJ", value: "TMJ movements smooth, no clicking or deviation." },
        { label: "TMJ Clicking", value: "Clicking noted on opening/closing." },
        { label: "Limited Mouth Opening", value: "Limited mouth opening (trismus)." },
        { label: "Muscle Tenderness", value: "Tenderness on palpation of muscles of mastication." }
      ],
      "Lymph Nodes": [
        { label: "Not Palpable", value: "Lymph nodes not palpable." },
        { label: "Enlarged/Tender", value: "Submandibular/cervical lymph nodes enlarged and tender." }
      ]
    }
  },
  softTissue: {
    title: "Soft Tissue Findings",
    defaultCategory: "Mucosa & Gingiva",
    categories: {
      "Mucosa & Gingiva": [
        { label: "Healthy", value: "Mucosa appears pink and healthy." },
        { label: "Ulceration", value: "Ulceration present on mucosa." },
        { label: "White Lesion", value: "White patch/lesion observed." },
        { label: "Sinus Tract", value: "Sinus tract/fistula present." }
      ],
      "Tongue & Floor of Mouth": [
        { label: "Normal", value: "Tongue and floor of mouth normal." },
        { label: "Coated Tongue", value: "Coated tongue." },
        { label: "Geographic Tongue", value: "Geographic tongue noted." }
      ],
      "Palate & Throat": [
        { label: "Normal", value: "Hard/soft palate and throat clear." },
        { label: "Inflamed Throat", value: "Throat appears inflamed/red." }
      ]
    }
  },
  periodontal: {
    title: "Periodontal Status",
    defaultCategory: "Gingival Health",
    categories: {
      "Gingival Health": [
        { label: "Healthy", value: "Gingiva pink, firm, no bleeding on probing." },
        { label: "Mild Gingivitis", value: "Mild gingival inflammation, slight BOP." },
        { label: "Moderate/Severe Gingivitis", value: "Moderate to severe gingivitis, spontaneous bleeding." }
      ],
      "Calculus & Plaque": [
        { label: "Minimal Plaque", value: "Minimal plaque, good oral hygiene." },
        { label: "Moderate Plaque/Calculus", value: "Moderate plaque and calculus present." },
        { label: "Heavy Calculus", value: "Heavy calculus deposits, poor oral hygiene." }
      ],
      "Periodontitis & Mobility": [
        { label: "Pocketing", value: "Periodontal pocketing present (>4mm)." },
        { label: "Recession", value: "Gingival recession noted." },
        { label: "Grade I Mobility", value: "Grade I mobility." },
        { label: "Grade II/III Mobility", value: "Grade II/III mobility." }
      ]
    }
  },
  occlusion: {
    title: "Occlusion",
    defaultCategory: "Classification",
    categories: {
      "Classification": [
        { label: "Class I", value: "Angle's Class I molar relationship." },
        { label: "Class II", value: "Angle's Class II molar relationship." },
        { label: "Class III", value: "Angle's Class III molar relationship." }
      ],
      "Overjet & Overbite": [
        { label: "Normal", value: "Normal overjet and overbite." },
        { label: "Increased Overjet", value: "Increased overjet." },
        { label: "Deep Bite", value: "Deep overbite." },
        { label: "Open Bite", value: "Anterior open bite." },
        { label: "Crossbite", value: "Crossbite present." }
      ],
      "Alignment": [
        { label: "Well Aligned", value: "Teeth well aligned." },
        { label: "Crowding", value: "Anterior crowding." },
        { label: "Spacing", value: "Generalized spacing/diastema." }
      ]
    }
  }
};
