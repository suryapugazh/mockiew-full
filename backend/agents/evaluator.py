import os
import json
import requests
from dotenv import load_dotenv
from prompts import EVALUATE_INTERVIEW

load_dotenv()
OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT")


def evaluate_candidate(resume, transcript, gaze, communication, interaction_summary):

    compressed_transcript = "\n".join(
        f"{msg['role'].upper()}: {msg['text']}"
        for msg in transcript
    )

    prompt = EVALUATE_INTERVIEW.format(
        resume=json.dumps(resume, indent=2),
        transcript=compressed_transcript,
        gaze=json.dumps(gaze, indent=2),
        communication=json.dumps(communication, indent=2),
        interaction_summary=json.dumps(interaction_summary, indent=2)
    )

    response = requests.post(
        OLLAMA_ENDPOINT,
        json={
            "model": "qwen2.5:7b-instruct",
            "prompt": prompt,
            "stream": False,
        }
    )

    data = response.json()

    # Handle model loading case (same pattern as your resume extractor)
    if data.get("done_reason") == "load":
        response = requests.post(
            OLLAMA_ENDPOINT,
            json={
                "model": "qwen2.5:7b-instruct",
                "prompt": prompt,
                "stream": False
            }
        )
        data = response.json()

    raw_output = data["response"]

    try:
        parsed = json.loads(raw_output)
    except:
        start = raw_output.find("{")
        end = raw_output.rfind("}") + 1
        parsed = json.loads(raw_output[start:end])

    return parsed