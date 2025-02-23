import os
import google.generativeai as genai
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)
# model = genai.GenerativeModel("gemini-2")
model = genai.GenerativeModel("gemini-2.0-flash-001")


def summarize_chapter(chapter_text: str, depth: int = 1) -> str:
    """
    Summarize a chapter using Gemini with different levels of detail.

    Args:
        chapter_text (str): The text content of the chapter
        depth (int): Level of detail (1-4), where:
            1 = Very high level (2-3 sentences)
            2 = Key points (1-2 paragraphs)
            3 = Detailed summary (3-4 paragraphs)
            4 = Comprehensive analysis (5+ paragraphs)

    Returns:
        str: The generated summary
    """
    # Validate depth
    if depth not in range(1, 5):
        raise ValueError("Depth must be between 1 and 4")

    # Create prompt based on depth
    depth_prompts = {
        1: "Provide a very concise 2-3 sentence summary:",
        2: "Summarize the key points in 1-2 paragraphs:",
        3: (
            "Provide a detailed summary in 3-4 paragraphs, including "
            "main ideas and details:"
        ),
        4: (
            "Give a comprehensive analysis, including themes, events, "
            "details, and significance:"
        ),
    }

    prompt = depth_prompts[depth] + "\n\n" + chapter_text

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Error generating summary: {str(e)}")


def summarize_chapter_file(
    chapter_path: str | Path, output_path: Optional[str | Path] = None, depth: int = 1
) -> str:
    """
    Read a chapter file and generate its summary, optionally saving to a file.

    Args:
        chapter_path (str | Path): Path to the chapter text file
        output_path (str | Path, optional): Path to save the summary
        depth (int): Summary detail level (1-4)

    Returns:
        str: The generated summary
    """
    # Convert to Path objects
    chapter_path = Path(chapter_path)
    if output_path:
        output_path = Path(output_path)

    # If path starts with backend/, remove it since we're already in backend dir
    if str(chapter_path).startswith("backend/"):
        chapter_path = Path(*chapter_path.parts[1:])

    # Validate input file
    if not chapter_path.exists():
        msg = f"Chapter file not found: {chapter_path}"
        raise FileNotFoundError(msg)

    # Read chapter content
    with open(chapter_path, "r", encoding="utf-8") as f:
        chapter_text = f.read()

    # Generate summary
    summary = summarize_chapter(chapter_text, depth)

    # Save summary if output path is provided
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(summary)

    return summary


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Summarize a chapter using Gemini")
    parser.add_argument("chapter_file", help="Path to the chapter text file")
    parser.add_argument("--output", "-o", help="Path to save the summary")
    parser.add_argument(
        "--depth",
        "-d",
        type=int,
        choices=[1, 2, 3, 4],
        default=1,
        help="Summary detail level (1=very concise, 4=comprehensive)",
    )

    args = parser.parse_args()

    try:
        summary = summarize_chapter_file(args.chapter_file, args.output, args.depth)
        if not args.output:
            print("\nSummary:")
            print("-" * 80)
            print(summary)
            print("-" * 80)
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)
