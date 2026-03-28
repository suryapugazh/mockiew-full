import os
import time
import httpx
from utils.name_extractor import extract_first_name

API_URL = os.getenv("API_URL")
LIVEAVATAR_API_KEY = os.getenv("LIVEAVATAR_API_KEY")
AVATAR_ID = os.getenv("AVATAR_ID")
VOICE_ID = os.getenv("VOICE_ID")
LANGUAGE = os.getenv("LANGUAGE")
IS_SANDBOX = os.getenv("IS_SANDBOX")


async def create_session(name: str, questions: list):

    first_name = extract_first_name(name)

    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": LIVEAVATAR_API_KEY,
    }

    questions_block = "\n".join([f"- {q}" for q in questions])
    # questions_block = "\n".join([f"{i+1}. {q}" for i, q in enumerate(questions)])

    async with httpx.AsyncClient() as client:
        context_response = await client.post(
            f"{API_URL}/v1/contexts",
            headers=headers,
            json={
                "name": f"interview_{int(time.time())}",
                "opening_text": f"Hello {first_name}, welcome to your mock interview.",
                "prompt": f"""
                    You are a friendly but professional mock interviewer.

                    STRICT RULES:
                    - You MUST ask ONLY the questions listed below.
                    - Ask EXACTLY one question at a time.
                    - Wait for the candidate to finish answering before asking the next question.
                    - Do NOT generate new questions.
                    - Do NOT add commentary.
                    - Do NOT paraphrase.
                    - After the final question, politely conclude the interview.

                    Interview Flow Instructions:

                    - Greet the candidate by their first name.
                    - After greeting, immediately begin the interview.
                    - Ask the following questions one by one in order.
                    - Wait for the candidate to complete their answer before asking the next question.
                    - If the candidate asks something unrelated (e.g., "can you hear me?"),
                      respond briefly and naturally, then continue the interview.
                    - After all questions are completed, politely conclude the session.

                    Questions:

                    {questions_block}
                    """
            },
        )

        context_data = context_response.json()
        context_id = context_data["data"]["id"]

        session_response = await client.post(
            f"{API_URL}/v1/sessions/token",
            headers=headers,
            json={
                "mode": "FULL",
                "avatar_id": AVATAR_ID,
                "avatar_persona": {
                    "voice_id": VOICE_ID,
                    "context_id": context_id,
                    "language": LANGUAGE,
                },
                "is_sandbox": IS_SANDBOX,
            },
        )

        session_data = session_response.json()

        return session_data["data"]["session_token"]




# Responses
"""

{
    "name": "Pugazhenthi S S",
    "email": "suryapugazh27@gmail.com",
    "phone": "+91-9659340023",
    "education": "B.Tech in Artificial Intelligence and Machine Learning, Expected Graduation: 2026, IFET College of Engineering, Villupuram, CGPA: 8.0 / 10",
    "work_experience": null,
    "skills": [
        "Java",
        "JavaScript",
        "Python",
        "SQL",
        "Node.js",
        "Express.js",
        "Spring Boot",
        "Flask",
        "RESTful APIs",
        "JWT-based Authentication",
        "HTML",
        "CSS",
        "React",
        "MySQL",
        "PostgreSQL",
        "Git",
        "GitHub",
        "Postman",
        "Linux",
        "Docker",
        "Agile (Scrum)"
    ],
    "certifications": [
        "Google Cloud Skills Boost: Earned hands-on badges covering cloud infrastructure, service operations, and introductory AI concepts.",
        "TNSIF – Capgemini CSR Full Stack Training: Learned core Java, PostgreSQL, and React, and built a small full stack project as part of the program."
    ],
    "internships": "Cloud Computing Intern | Software Logic Technologies",
    "questions": [
        "Tell me about yourself.",
        "How have you applied your knowledge of RESTful APIs in any of your projects?",
        "Can you describe your experience with using Sequelize ORM in the DocToYou project?"
    ]
}

"""



"""

{
    "name": "Priyaddharshan S",
    "email": "priyaddharshan@gmail.com",
    "phone": "+91 8220733013",
    "education": "B.Tech. in Artificial Intelligence and Machine Learning, IFET College of Engineering, Villupuram (2022 – 2026)",
    "work_experience": null,
    "skills": [
        "Python",
        "Java",
        "HTML",
        "CSS",
        "JavaScript",
        "MERN Stack",
        "MySQL",
        "MongoDB",
        "VS Code",
        "Git",
        "GitHub",
        "AWS (EC2, S3, IAM)"
    ],
    "certifications": [
        "Java Full Stack – Complete Course for Java Developers (Wipro)",
        "Crash Course in Python (Google)",
        "HTML, CSS (GreatLearning)",
        "Prompt Engineering (GreatLearning)"
    ],
    "internships": "Cloud Computing Engineer Intern – SoftwareLogic Technologies (Jan 2025)",
    "questions": [
        "Tell me about yourself.",
        "How have you applied your knowledge of the MERN stack in your projects?",
        "Can you describe a time when you had to solve a problem related to cloud computing during your internship?"
    ]
}

"""