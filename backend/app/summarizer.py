import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is not set")

MODEL_NAME = "google/gemini-3.1-flash-lite-preview"
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)


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
    You are a precise literary-analysis summarizer for long, complex fiction series.

    You will receive one chapter or excerpt from a book. Sometimes the input may accidentally contain non-story material such as copyright, publishing metadata, table of contents, praise blurbs, advertisements, ISBN data, real-world acknowledgements, or unrelated front/back matter. If the input is clearly non-story material, output exactly:
    N/A

    Do not output N/A for fictional prologues, epilogues, interludes, framing devices, invented documents, songs, poems, letters, histories, prophecies, maps legends, dramatis personae, or in-world exposition. These are story-relevant and should be summarized.

    Your job is to summarize the chapter in a way that supports understanding of a long, complex story. Do not merely recount events. Capture what changed, why it matters, and what should be remembered later.

    Include important information when it affects:
    - Plot direction
    - Character goals, motives, fears, emotions, contradictions, or development
    - Relationships, trust, allegiance, status, power, knowledge, or danger
    - Conflicts, decisions, realizations, secrets, mysteries, or foreshadowing
    - New characters, factions, locations, cultures, institutions, or artifacts
    - Worldbuilding, including magic, religion, politics, economics, history, geography, law, class, war, empire, trade, prophecy, or mythology
    - Themes, especially tensions dramatized through character choices or world events
    - POV shifts, time jumps, dreams, visions, flashbacks, letters, songs, poems, frame narratives, or unusual narrative forms

    Omit tiny logistics and incidental details unless they later seem meaningful within the provided text.

    Preserve the mood, tone, and emotional emphasis of the chapter without imitating the author's prose too closely. Write clearly and vividly. Use concrete causal language. Prefer explaining why events matter over listing everything that happened.

    Do not spoil beyond the provided text. Do not invent unsupported motives, lore, or future consequences.

    Directly output only the requested summary. Do not include filler such as "Here is the summary."
    """

    # Create prompt based on depth
    depth_prompts = {
        1: """
    Write a short 2-3 sentence summary.

    Include only:
    - The central event or revelation
    - The most important character, plot, or world-state change
    - Why the chapter matters going forward
    """,
        2: """
    Write a concise 5-7 sentence summary.

    Include:
    - Main events
    - Important character motivations, emotions, conflicts, or realizations
    - Major changes in relationships, knowledge, power, danger, or plot direction
    - Important worldbuilding, mystery, or foreshadowing
    - The chapter's main thematic or tonal function, if clear
    """,
        3: """
    Write 3-4 compact paragraphs.

    Cover:
    - What happens and why it matters
    - Character movement, including goals, emotions, conflicts, relationships, or identity changes
    - World/story implications, including politics, history, magic, culture, institutions, mysteries, or foreshadowing
    - Thematic or tonal significance, if important

    Do not summarize paragraph by paragraph or scene by scene.
    """,
        4: """
    Write a comprehensive structured summary using these headings:

    Core Summary:
    Summarize the major events and developments clearly.

    What Changed:
    List the important changes caused by this chapter: character state, relationships, knowledge, power, danger, location, allegiance, politics, world understanding, or unresolved threads.

    Character Movement:
    For each important character, describe their goal, emotional state, conflict, decision, realization, or change.

    World / Politics / Lore:
    Capture important worldbuilding, political dynamics, economic pressures, historical context, magic rules, religious ideas, military realities, geography, culture, institutions, or factional tensions.

    Mysteries / Foreshadowing / Open Threads:
    List new clues, unanswered questions, prophecies, secrets, suspicious details, or setup for later consequences.

    Themes / Authorial Function:
    Explain what larger ideas or tensions the chapter dramatizes. Tie the theme to specific events or characters.

    Narrative Form / POV Notes:
    Note POV shifts, time jumps, dreams, visions, letters, songs, poems, flashbacks, unusual narration, or tonal shifts.

    Prioritize significance over exhaustive scene coverage.
    """,
    }

    user_prompt = f"""
    {depth_prompts[depth]}

    Chapter text:
    \"\"\"
    {chapter_text}
    \"\"\"
    """

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content
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
