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

    system_prompt = """
    You are an efficient book summarizer. You will be given a chapter from a book, although sometimes you will be accidentally given the book metadata or acknowledgements or copyright, etc. which is not part of the story text. In that case, just skip and say "N/A". However, some fiction books have text like narrator dialogue or exposition or prologue or epilogue or preface, but IS fictional (story related), which you SHOULD summarize and should not skip.
    
    Your job is to summarize the chapter in a way that is easy to understand and to the point. Recognize what is the most important information in each chapter and convey that. Not every tiny detail is important. However, things like emotional events and emotional state, conflicts, motivations, shocking events may be salient.

    Try to use the author's voice and style, and choose exact and impactful words that convey the mood and tone of the chapter, but don't use too complex vocabulary. Vary your sentence lengths, make the writing flow well, don't use too many commas.

    Directly state ONLY the summary, DO NOT include any filler words like `this passage says...` or any preface like "okay, here's a summary...".
    
    Be sure to describe all main events, new characters appearances and characterizations, locations, important realizations by characters, any peculiar narrator musings, etc.

    If any important character motivations or internal or external conflicts are revealed, describe them.

    Note POV shifts, time jumps, backstory narration, or format changes (letters, poems, etc.).

    You must adhere to output length limits:

    """

    # Create prompt based on depth
    depth_prompts = {
        1: "Write a short 2-3 sentence summary, include only on the most important events and developments. Feel free to omit minor details.",
        2: "Length: 5-7 sentences:",
        3: "Length: 3-4 paragraphs:",
        4: (
            "Give a comprehensive summary. First think of how to break up the chapter into sections (eg. each time the chapter switches POV or location changes). Then summarize each section individually and thoroughly. Be sure to include all important details:"
        ),
    }

    prompt = system_prompt + "\n\n" + depth_prompts[depth] + "\n\n" + chapter_text

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
    If the summary is "N/A", updates the metadata.json to mark this as a non-chapter.

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

        # If this is a depth-1 summary and it's "N/A", update the metadata
        if depth == 1 and summary.strip() == "N/A":
            try:
                # Get book directory (2 levels up from summaries dir)
                book_dir = output_path.parent.parent
                metadata_path = book_dir / "metadata.json"

                # Get chapter number from the output path
                chapter_num = int(output_path.stem.split("-")[1])

                # Update metadata
                if metadata_path.exists():
                    import json

                    with open(metadata_path, "r") as f:
                        metadata = json.load(f)

                    # Update the isNonChapter flag for this chapter
                    for chapter in metadata["chapters"]:
                        if chapter["number"] == chapter_num:
                            chapter["isNonChapter"] = True
                            break

                    # Save updated metadata
                    with open(metadata_path, "w") as f:
                        json.dump(metadata, f, indent=2)
            except Exception as e:
                print(f"Warning: Failed to update metadata for non-chapter: {e}")

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
