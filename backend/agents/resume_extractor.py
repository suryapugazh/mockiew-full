import os
import json
import requests
from dotenv import load_dotenv
from prompts import PROCESS_RESUME_AND_GENERATE_QUESTIONS

load_dotenv()
OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT")

def extract_resume_data(resume_data):

    prompt = PROCESS_RESUME_AND_GENERATE_QUESTIONS.format(resume_text = resume_data)

    payload_data = {
        "model": "qwen2.5:7b-instruct",
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "keep_alive": "60m"
        }
    }
        # "options": {
        #     "keep_alive": "30m", - to persist model in CPU memory for 30min
        #     "num_ctx": 4096  - to set context length, increasing cause slow response, decreasing cause speed response
        #                      - The best low num_ctx setting is 2048 or 1024 for intel i5 1240p 8gb ram
        # },

    # payload = json.dumps(payload_data)

    response = requests.post(OLLAMA_ENDPOINT, json=payload_data)

    data = response.json()

    if data.get("done_reason") == "load":
        response = requests.post(OLLAMA_ENDPOINT, json=payload_data)
        data = response.json()

    # print(response)

    response = response.json()['response']

    return response

"""
{
    "model": "qwen2.5:7b-instruct",
    "created_at": "2026-02-21T11:58:24.4363577Z",
    "response": "{\n\"name\": \"Pugazhenthi S S\",\n\"email\": \"suryapugazh27@gmail.com\",\n\"phone\": \"+91-9659340023\",\n\"education\": \"B.Tech in Artificial Intelligence and Machine Learning\",\n\"work_experience\": null,\n\"skills\": [\"Java\", \"JavaScript\", \"Python\", \"SQL\", \"Node.js\", \"Express.js\", \"Spring Boot\", \"Flask\", \"RESTful APIs\", \"JWT-based Authentication\", \"HTML\", \"CSS\", \"React\", \"MySQL\", \"PostgreSQL\", \"Git\", \"GitHub\", \"Postman\", \"Linux\", \"Docker\", \"Agile (Scrum)\"],\n\"certifications\": [\"Google Cloud Skills Boost: Earned hands-on badges covering cloud infrastructure, service operations, and introductory AI concepts.\", \"TNSIF – Capgemini CSR Full Stack Training: Learned core Java, PostgreSQL, and React, and built a small full stack project as part of the program.\"],\n\"internships\": \"Cloud Computing Intern | Software Logic Technologies\"\n}",
    "done": true,
    "done_reason": "stop",
    "context": [...],
    "total_duration": 131372655400,
    "load_duration": 299505500,
    "prompt_eval_count": 914,
    "prompt_eval_duration": 86661023600,
    "eval_count": 226,
    "eval_duration": 36018484900
}

"""

"""

"model": "gemma3:4b",
    "created_at": "2026-02-21T12:15:50.2673188Z",
    "response": "{\n\"name\": \"Pugazhenthi S S\",\n\"email\": \"suryapugazh27@gmail.com\",\n\"phone\": \"+91-9659340023\",\n\"education\": \"B.Tech in Artificial Intelligence and Machine Learning\",\n\"work_experience\": 3,\n\"skills\": [\n\"Java\",\n\"JavaScript\",\n\"Python\",\n\"SQL\",\n\"Node.js\",\n\"Express.js\",\n\"Spring Boot\",\n\"Flask\",\n\"RESTful APIs\",\n\"JWT-based Authentication\",\n\"HTML\",\n\"CSS\",\n\"React\",\n\"MySQL\",\n\"PostgreSQL\",\n\"Git\",\n\"GitHub\",\n\"Postman\",\n\"Linux\",\n\"Docker\",\n\"Agile (Scrum)\"\n],\n\"certifications\": [\n\"Google Cloud Skills Boost\",\n\"TNSIF – Capgemini CSR Full Stack Training\"\n],\n\"internships\": \"Cloud Computing Intern | Software Logic Technologies\",\n\"projects\": 2\n}",
    "done": true,
    "done_reason": "stop",
    "context": [...],
    "total_duration": 75740091100,
    "load_duration": 6478981300,
    "prompt_eval_count": 940,
    "prompt_eval_duration": 46025262400,
    "eval_count": 233,
    "eval_duration": 22384994400
}


{
    "model": "qwen2.5:3b-instruct",
    "created_at": "2026-02-21T12:36:49.9420309Z",
    "response": "{\n\"name\": \"Pugazhenthi S S\",\n\"email\": \"s.s.pugazhenthi@surypugazh27@gmail.com\",\n\"phone\": \"+91-9659340023\",\n\"education\": \"B.Tech in Artificial Intelligence and Machine Learning, Expected Graduation: 2026, IFET College of Engineering, Villupuram, CGPA: 8.0 / 10\",\n\"work_experience\": 4,\n\"skills\": [\"Java\", \"JavaScript\", \"Python\", \"SQL\", \"Node.js\", \"Express.js\", \"Spring Boot\", \"Flask\", \"RESTful APIs\", \"JWT-based Authentication\", \"HTML\", \"CSS\", \"React\", \"Git\", \"GitHub\", \"Postman\", \"Linux\", \"Docker\", \"Agile (Scrum)\"],\n\"certifications\": [\"Google Cloud Skills Boost: Earned hands-on badges covering cloud infrastructure, service operations, and introductory AI concepts\", \"TNSIF - Capgemini CSR Full Stack Training: Learned core Java, PostgreSQL, and React, built a small full stack project as part of the program\"],\n\"internships\": \"Cloud Computing Intern at Software Logic Technologies\"\n}",
    "done": true,
    "done_reason": "stop",
    "context": [...],
    "total_duration": 70831587500,
    "load_duration": 2838900000,
    "prompt_eval_count": 914,
    "prompt_eval_duration": 38395232100,
    "eval_count": 259,
    "eval_duration": 20076987800
}

"""