Database Design — Smart Medicine Safety & Drug Interaction Assistant

1. Overview

The application uses a relational PostgreSQL database hosted through Supabase.
The database manages:
User profiles
Canonical medicine information
Medicine aliases and brand names
External medicine-data sources
User medication lists
Drug-drug interaction data
Interaction safety checks
Interaction check results and history
The core database is designed around 8 tables.


2. Database Architecture
                         SUPABASE
                    PostgreSQL Database
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
 USER DOMAIN          MEDICINE DOMAIN       DDI DOMAIN
       │                    │                    │
       ▼                    ▼                    ▼
   profiles             medicines       drug_interactions
       │                    │                    │
       │             ┌──────┴──────┐             │
       │             ▼             ▼             │
       │      medicine_aliases  medicine_sources │
       │                    │                    │
       └───────────┐        │                    │
                   ▼        ▼                    │
              patient_medications               │
                   │                            │
                   └──────────────┐             │
                                  ▼             │
                         interaction_checks     │
                                  │             │
                                  ▼             │
                     interaction_check_results │
                                  │             │
                                  └─────────────┘


3. Core Tables
#	Table	Purpose
1	profiles	Stores application user profiles
2	medicines	Stores canonical medicine information
3	medicine_aliases	Stores brand names, alternate names, and misspellings
4	medicine_sources	Stores external source identifiers and references
5	patient_medications	Stores medicines associated with each user's medication list
6	drug_interactions	Stores drug-drug interaction information
7	interaction_checks	Stores individual safety checks performed by users
8	interaction_check_results	Stores individual interaction results from each check


4. Table Specifications

4.1 profiles
Purpose
Stores application-level information about authenticated users.
Authentication credentials and sessions will be handled by Supabase Auth. This table stores additional user profile information.
Field	Type	Constraints	Description
id	UUID	Primary Key	Supabase Auth user ID
full_name	VARCHAR(150)	Nullable	User's full name
email	VARCHAR(255)	Unique	User email
role	VARCHAR(30)	Default: patient	User role
created_at	TIMESTAMP	Not Null	Account creation time
updated_at	TIMESTAMP	Not Null	Last profile update


Roles
patient
caregiver
pharmacist


4.2 medicines
Purpose
Stores the canonical representation of a medicine.
This is the central medicine entity referenced by the rest of the database.
Field	Type	Constraints	Description
id	UUID	Primary Key	Internal medicine identifier
generic_name	VARCHAR(255)	Not Null	Generic/standard medicine name
normalized_name	VARCHAR(255)	Indexed	Normalized searchable medicine name
rxcui	VARCHAR(50)	Unique, Nullable	RxNorm Concept Unique Identifier
drug_class	VARCHAR(255)	Nullable	Drug classification
dosage_form	VARCHAR(100)	Nullable	Tablet, capsule, syrup, etc.
strength	VARCHAR(100)	Nullable	Medicine strength
created_at	TIMESTAMP	Not Null	Record creation time
updated_at	TIMESTAMP	Not Null	Last update time


4.3 medicine_aliases
Purpose
Stores alternate names associated with a canonical medicine.
Supports:
Brand-name searches
Generic-name searches
Alternate spellings
Common misspellings
Indian medicine brands
Field	Type	Constraints	Description
id	UUID	Primary Key	Alias identifier
medicine_id	UUID	Foreign Key	Associated medicine
alias_name	VARCHAR(255)	Not Null	Original alias
alias_type	VARCHAR(30)	Not Null	Type of alias
normalized_alias	VARCHAR(255)	Indexed	Search-normalized alias
source	VARCHAR(100)	Nullable	Origin of alias
created_at	TIMESTAMP	Not Null	Record creation time


Alias Types
brand
generic
alternate
misspelling

4.4 medicine_sources
Purpose
Maintains links between medicines in the database and external medical data sources.
This provides data traceability and allows multiple external sources to be associated with the same medicine.
Field	Type	Constraints	Description
id	UUID	Primary Key	Source record identifier
medicine_id	UUID	Foreign Key	Associated medicine
source_name	VARCHAR(100)	Not Null	External source
source_id	VARCHAR(255)	Not Null	Identifier from source
source_url	TEXT	Nullable	Reference URL
last_verified_at	TIMESTAMP	Nullable	Last verification time


Expected Sources
RxNorm
DDInter
openFDA
DailyMed

4.5 patient_medications
Purpose
Stores the medicines currently associated with a user's medication list.
Field	Type	Constraints	Description
id	UUID	Primary Key	Medication record identifier
user_id	UUID	Foreign Key	Associated profile
medicine_id	UUID	Foreign Key	Associated medicine
dosage	VARCHAR(100)	Nullable	Dosage
frequency	VARCHAR(100)	Nullable	Frequency of use
route	VARCHAR(50)	Nullable	Oral, topical, etc.
start_date	DATE	Nullable	Medication start date
end_date	DATE	Nullable	Medication end date
is_active	BOOLEAN	Default: TRUE	Whether currently taking
notes	TEXT	Nullable	Additional notes
created_at	TIMESTAMP	Not Null	Record creation time
updated_at	TIMESTAMP	Not Null	Last update time


Relationship
User
 │
 ├── Paracetamol
 ├── Metformin
 └── Amlodipine

4.6 drug_interactions
Purpose
Stores structured drug-drug interaction information.
This is the core DDI knowledge table of the application.
The primary DDI source will be DDInter 2.0.
Field	Type	Constraints	Description
id	UUID	Primary Key	Internal interaction identifier
drug_a_id	UUID	Foreign Key	First medicine
drug_b_id	UUID	Foreign Key	Second medicine
severity	VARCHAR(50)	Not Null	Interaction severity
description	TEXT	Nullable	Interaction description
mechanism	TEXT	Nullable	Interaction mechanism
management	TEXT	Nullable	Recommended management
source	VARCHAR(100)	Not Null	Data source
source_id	VARCHAR(255)	Nullable	External interaction identifier
source_reference	TEXT	Nullable	Supporting reference
created_at	TIMESTAMP	Not Null	Record creation time
updated_at	TIMESTAMP	Not Null	Last update time


Severity
The source severity will be mapped by the interaction engine into:
Mild
Moderate
Severe
Interaction Pair Rule
The same drug pair should not be stored twice.
For example:
Warfarin + Ibuprofen
and
Ibuprofen + Warfarin
represent the same interaction.


4.7 interaction_checks
Purpose
Represents one complete safety check performed by a user.
For example:
Warfarin
Ibuprofen
Aspirin
      ↓
Check Safety
creates one interaction_checks record.
Field	Type	Constraints	Description
id	UUID	Primary Key	Safety check identifier
user_id	UUID	Foreign Key	User performing the check
overall_risk	VARCHAR(50)	Nullable	Overall risk classification
medicine_count	INTEGER	Not Null	Number of medicines checked
status	VARCHAR(30)	Default: completed	Check status
checked_at	TIMESTAMP	Not Null	Time of check


Status Values
completed
failed


4.8 interaction_check_results
Purpose
Stores individual interaction results generated by a safety check.
A single safety check can produce multiple results.
Example:
Safety Check #101

Warfarin + Ibuprofen → Severe
Warfarin + Aspirin   → Severe
Ibuprofen + Aspirin  → Moderate
Field	Type	Constraints	Description
id	UUID	Primary Key	Result identifier
check_id	UUID	Foreign Key	Parent safety check
interaction_id	UUID	Foreign Key	Detected interaction
severity	VARCHAR(50)	Not Null	Severity
explanation	TEXT	Nullable	Plain-language explanation
recommendation	TEXT	Nullable	User-facing recommendation
created_at	TIMESTAMP	Not Null	Result creation time


5. Entity Relationships
profiles
   │
   ├───────────────┐
   │               │
   ▼               ▼
patient_medications   interaction_checks
   │                      │
   ▼                      ▼
medicines          interaction_check_results
   │                      │
   ├── medicine_aliases   ▼
   └── medicine_sources  drug_interactions
                              │
                       ┌──────┴──────┐
                       ▼             ▼
                   medicine A    medicine B
Relationship Summary
Relationship	Type
profiles → patient_medications	One-to-Many
profiles → interaction_checks	One-to-Many
medicines → patient_medications	One-to-Many
medicines → medicine_aliases	One-to-Many
medicines → medicine_sources	One-to-Many
medicines → drug_interactions	One-to-Many
interaction_checks → interaction_check_results	One-to-Many
drug_interactions → interaction_check_results	One-to-Many


6. External Data Sources
Source	Role
RxNorm	Medicine normalization and identification
DDInter 2.0	Primary drug-drug interaction source
openFDA	Supporting drug-label evidence
DailyMed	Supporting drug-label information


Data Flow
User Medicine Input
        ↓
      RxNorm
        ↓
Canonical Medicine
        ↓
    medicines
        ↓
   DDInter 2.0
        ↓
drug_interactions
        ↓
Interaction Engine
        ↓
Risk + Explanation + Recommendation


7. Interaction Detection Flow
User selects medicines
        ↓
Medicine normalization
        ↓
Canonical medicine IDs
        ↓
Generate unique medicine pairs
        ↓
Query drug_interactions
        ↓
Interaction found?
     /       \
   YES        NO
    │          │
    ▼          ▼
Retrieve     No interaction
interaction  detected
details
    │
    ▼
Risk classification
    │
    ▼
Plain-language explanation
    │
    ▼
Recommendation
    │
    ▼
Store interaction_check
    │
    ▼
Store interaction_check_results
    │
    ▼
Display result + history




8. Data Integrity Rules
The database should enforce:
Each user has a unique profile.
A medication must reference an existing medicine.
An interaction must reference two existing medicines.
The same drug pair must not be stored twice.
An interaction result must reference an existing safety check.
An interaction result must reference an existing drug interaction.
User-owned records must be protected using Row Level Security.
External medical data should retain source information where available.


9. Final Schema
┌─────────────────┐
│    profiles     │
└────────┬────────┘
         │
    ┌────┴───────────────┐
    │                    │
    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│patient_medications│  │interaction_checks│
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌────────────────────────┐
│    medicines    │   │interaction_check_results│
└───────┬─────────┘   └──────────┬─────────────┘
        │                        │
   ┌────┴─────┐                  ▼
   ▼          ▼          ┌──────────────────┐
┌────────┐ ┌──────────┐  │drug_interactions │
│aliases │ │ sources  │  └────────┬─────────┘
└────────┘ └──────────┘           │
                            ┌──────┴──────┐
                            ▼             ▼
                        Medicine A    Medicine B
