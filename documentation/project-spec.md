# Book Summarizer - Project Specification

## Overview

The Book Summarizer is an interactive web application that allows users to upload PDF/epub books and receive AI-generated summaries with expandable sections for varying levels of detail, similar to a HackerNews comment thread interface.

## Core Features

### 1. Document Upload & Processing

- Users can upload PDF/epub/mobi files through a drag-and-drop interface or file selector
- System validates file type and size
- Documents are processed based on format:
  - EPUB: Native processing using epub structure for accurate chapter detection
  - PDF: Text extraction with smart chapter detection
  - Other formats: Conversion to text with basic chapter detection
- Progress indicator shows processing status

### 2. Book Summary Generation

- Initial high-level summary of the entire book is generated
- Each chapter gets its own summary
- Summaries are generated using Google's Gemini flash 2 LLM
- Summaries are cached locally to prevent redundant API calls

### 3. Interactive Summary Interface

- Hierarchical, tree-like structure for viewing summaries
- Expandable/collapsible sections at multiple levels:
  - Book level (highest level overview)
  - Chapter level (chapter summaries)
  - Section level (detailed section breakdowns)
  - Paragraph level (most detailed analysis)
- Visual indicators show which sections are expanded/collapsed
- Loading states for when new summaries are being generated

### 4. Storage System

- Each book has its own directory with:
  - Individual chapter files for easy access
  - Book metadata (title, chapters, etc)
  - Chapter summaries cached separately
- Storage structure:
  ```
  /books
    /book-id/
      metadata.json     # Book info and chapter metadata
      chapters/        # Extracted chapter content
        chapter-1.txt
        chapter-2.txt
        ...
      summaries/       # Generated summaries
        chapter-1.txt
        chapter-2.txt
        main.txt      # Overall book summary
  ```

## User Flow

1. **Initial Landing**

   - User arrives at landing page
   - Sees upload interface with instructions
   - Option to view sample book summary

2. **Book Upload**

   - User uploads PDF or mobi or epub or etc
   - System shows processing indicator
   - Conversion status is displayed

3. **Summary View**

   - Initial book summary is displayed
   - Chapter list is shown with collapse/expand options
   - User can click to expand any section
   - Loading indicators show when new summaries are being generated

4. **Detail Exploration**
   - User clicks expand on any section
   - System either:
     a. Loads cached summary if available
     b. Generates new summary using Gemini flash 2
   - New detail level is smoothly inserted into the view
   - Process repeats for deeper levels of detail

## UI/UX Requirements

### Main Interface

- Clean, minimalist design
- Dark/light mode support
- Clear visual hierarchy
- Responsive design for all screen sizes

### Summary Display

- Indentation to show hierarchy levels
- Expand/collapse icons
- Loading spinners for active generations
- Smooth animations for expanding/collapsing

### Interactive Elements

- Hover states for expandable sections
- Clear visual feedback for user actions
- Keyboard navigation support
- Accessibility considerations (ARIA labels, semantic HTML)

## Performance Requirements

- Initial page load < 2 seconds
- PDF processing feedback within 500ms
- support 500+ page books
- Summary generation complete with LLM within 10 second
- Smooth animations (60fps)
- Responsive on mobile devices
- Graceful degradation without internet

## Error Handling

- Clear error messages for:
  - Invalid file types
  - File size limits
  - Processing failures
  - API failures
  - Network issues
- Retry mechanisms for failed API calls
- Cache validation and error recovery

## Future Considerations

- User accounts for saving summaries
- Multiple book management
- Summary sharing capabilities
- Additional file format support
- Custom summary depth settings
- Export functionality
- Collaborative annotations
