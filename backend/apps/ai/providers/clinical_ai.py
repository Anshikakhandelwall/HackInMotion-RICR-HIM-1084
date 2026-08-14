"""Clinical AI Provider for MediGuard.

Generates structured clinical safety explanations for drug-drug interactions,
addressing three key patient questions:
1. What does this mean?
2. What to watch for?
3. What should you do?
"""

from __future__ import annotations
import json
import logging
import os
import urllib.request
import urllib.parse
from .base import LLMProvider, ProviderError

logger = logging.getLogger(__name__)

# Known interaction knowledge base for high-confidence clinical descriptions
CLINICAL_KNOWLEDGE_BASE = {
    ("naproxen", "warfarin"): {
        "meaning": "Taking naproxen together with warfarin significantly increases your risk of serious gastrointestinal bleeding and hemorrhaging. Naproxen is an NSAID pain reliever that impairs platelet function and irritates the stomach lining, while warfarin is an anticoagulant blood thinner.",
        "watch_for": "Watch closely for warning signs of internal bleeding: unusual dark, tarry, or bloody stools; pink, red, or dark brown urine; unexpected bruising; coughing or vomiting blood; severe abdominal pain; or persistent dizziness and weakness.",
        "action": "Do not combine naproxen with warfarin without explicit advice from your healthcare provider. Contact your doctor or pharmacist promptly to discuss safer pain relief alternatives, such as acetaminophen (Tylenol), and never adjust your prescribed warfarin dosage on your own."
    },
    ("aspirin", "warfarin"): {
        "meaning": "Combining aspirin with warfarin creates a potent additive blood-thinning effect that significantly raises your risk of major internal bleeding. Aspirin permanently inhibits blood platelet aggregation, while warfarin blocks vitamin K-dependent clotting factors.",
        "watch_for": "Be alert for signs of bleeding: frequent nosebleeds, bleeding gums that won't stop, unexplained large bruises, blood in urine or stool, unusual dizziness, or sudden severe headaches.",
        "action": "Consult your prescribing doctor immediately before taking aspirin alongside warfarin. Always check over-the-counter pain and cold medicines for hidden aspirin (salicylates) and seek immediate medical evaluation if bleeding occurs."
    },
    ("metformin", "contrast"): {
        "meaning": "Taking metformin around the time of iodinated radiocontrast procedures increases the risk of contrast-induced acute kidney injury and life-threatening metformin-associated lactic acidosis.",
        "watch_for": "Monitor for symptoms of lactic acidosis: severe fatigue, muscle aches, trouble breathing, unexplained stomach discomfort, feeling cold, or feeling lightheaded.",
        "action": "Inform your imaging provider and doctor about metformin prior to any CT scan or procedure using contrast dye. Metformin is typically withheld 48 hours prior to and after the procedure."
    }
}


class ClinicalAIProvider(LLMProvider):
    name = "clinical_ai"

    @property
    def model_id(self) -> str:
        return "mediguard-clinical-ai-v1"

    def generate(self, *, system: str, user: str, max_tokens: int = 1024) -> str:
        # Check if an external LLM key is available (Gemini or OpenAI)
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                payload = json.dumps({
                    "contents": [{
                        "parts": [{
                            "text": f"{system}\n\n{user}\n\nProvide response in JSON format with keys: 'what_does_this_mean', 'what_to_watch_for', 'what_should_you_do'."
                        }]
                    }]
                }).encode('utf-8')
                req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return text
            except Exception as e:
                logger.warning(f"Gemini API call failed, using clinical engine fallback: {e}")

        if openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                payload = json.dumps({
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": f"{user}\n\nProvide JSON response with keys: 'what_does_this_mean', 'what_to_watch_for', 'what_should_you_do'."}
                    ],
                    "max_tokens": max_tokens
                }).encode('utf-8')
                req = urllib.request.Request(url, data=payload, headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                })
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.warning(f"OpenAI API call failed, using clinical engine fallback: {e}")

        # Fallback to Clinical Rule Synthesis Engine
        return self._synthesize_clinical_explanation(user)

    def _synthesize_clinical_explanation(self, user_prompt: str) -> str:
        prompt_lower = user_prompt.lower()

        # Match known pair in knowledge base
        for (m1, m2), data in CLINICAL_KNOWLEDGE_BASE.items():
            if m1 in prompt_lower and m2 in prompt_lower:
                return json.dumps({
                    "what_does_this_mean": data["meaning"],
                    "what_to_watch_for": data["watch_for"],
                    "what_should_you_do": data["action"]
                })

        # Generic clinical synthesis for arbitrary drug pairs
        medicines = []
        for line in user_prompt.splitlines():
            if line.strip().startswith("- Medicines:"):
                meds_str = line.split(":", 1)[1].strip()
                medicines = [m.strip() for m in meds_str.split("+")]

        med_a = medicines[0] if len(medicines) > 0 else "Medicine A"
        med_b = medicines[1] if len(medicines) > 1 else "Medicine B"

        severity = "major" if "major" in prompt_lower else "moderate" if "moderate" in prompt_lower else "potential"

        return json.dumps({
            "what_does_this_mean": (
                f"Combining {med_a} and {med_b} involves a {severity} drug interaction risk. "
                f"Taking these medications together can alter how your body metabolizes them, potentially increasing side effects or diminishing therapeutic benefit."
            ),
            "what_to_watch_for": (
                f"Be observant for unexpected symptoms such as unusual fatigue, stomach discomfort, headache, changes in blood pressure, "
                f"or any signs of heightened toxicity associated with {med_a} or {med_b}."
            ),
            "what_should_you_do": (
                f"Discuss this potential interaction with your prescribing doctor or pharmacist before taking {med_a} and {med_b} together. "
                f"Do not alter your dosages or stop taking either medication without medical guidance."
            )
        })
