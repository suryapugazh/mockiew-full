def extract_first_name(full_name: str) -> str:
    if not full_name:
        return "Candidate"

    parts = full_name.strip().split()

    for part in parts:
        clean_part = part.replace(".", "")
        if len(clean_part) > 1:
            return clean_part.capitalize()
            
    return parts[0].replace(".", "").capitalize()