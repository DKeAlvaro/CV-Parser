from openai import OpenAI
import dotenv
import os
from pdf2image import convert_from_path
import base64
import io

dotenv.load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def load_pdf(file_path):
    images = convert_from_path(file_path)
    return images

def encode_image(image):
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()
    return base64.b64encode(img_byte_arr).decode('utf-8')

def score_cv(images):
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Return the score and parsed information of the CV following STRICTLY the format (no ```json):
                        {
                            "content": int, (1-10) -> Does it show potential?
                            "cleanliness": int, (1-10) -> Is it well written?
                            "good": str -> What is good about it? Add specific sentences you liked.
                            "bad": str -> What is bad about it? Add specific sentences you didn't like.
                            "notes": str -> Any other notes (optional). What stood out, colors, fonts.
                            "personal_info": {
                                "name": str -> Full name of the candidate,
                                "email": str -> Email address,
                                "phone": str -> Phone number,
                                "location": str -> Current location/address,
                                "education": str -> Most relevant education details,
                                "experience": str -> Brief summary of relevant work experience,
                                "skills": str -> Key technical and soft skills
                            }
                        }
                        """,
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{encode_image(images[0])}"},
                    },
                ],
            }
        ]
    )
    return completion.choices[0].message.content

if __name__ == "__main__":
    pdf_path = "best_resume.pdf"
    images = load_pdf(pdf_path)
    cv_text = score_cv(images)
    print(cv_text)
    
