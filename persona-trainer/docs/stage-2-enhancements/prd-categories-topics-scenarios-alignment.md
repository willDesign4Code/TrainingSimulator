# Product Requirements Document (PRD)
## Visual Alignment of Categories, Topics, and Scenarios Pages

**Version:** 1.0
**Date:** November 4, 2025
**Stage:** Stage 2 - Enhancements
**Status:** Draft

---

## 1. Executive Summary

This PRD outlines the requirements to create visual consistency across the Categories, Topics (CategoryDetails), and Scenarios (TopicDetails) pages for Admins and Managers. The goal is to provide a unified, cohesive user experience by standardizing UI components, navigation patterns, filtering options, and card designs across all three administrative views.

---

## 2. Background & Context

### Current State
The three administrative pages (Categories, Topics/CategoryDetails, and Scenarios/TopicDetails) currently have inconsistent visual designs:

- **Categories Page** ([Categories.tsx](../../src/pages/Categories.tsx))
  - Uses icon-based back button
  - Has Sort By filter with 4 options
  - Cards display with variant="h6" titles
  - Buttons use warning (amber) color
  - Shows Public/Private chips

- **Topics Page** ([CategoryDetails.tsx](../../src/pages/CategoryDetails.tsx))
  - Uses icon button back navigation
  - No sort functionality
  - TopicCard component with variant="h5" titles
  - Shows Role chips on cards
  - Standard button styling

- **Scenarios Page** ([TopicDetails.tsx](../../src/pages/TopicDetails.tsx))
  - Uses icon button back navigation
  - Has "Filter by Difficulty" dropdown
  - ScenarioCard component with variant="h6" titles
  - Full overview text displayed (truncated at 100 chars)
  - Mixed button styling

### Problem Statement
The visual inconsistency across these three pages creates a disjointed user experience for Admins and Managers. Users navigating between these pages encounter different interaction patterns, button styles, navigation methods, and card layouts, reducing overall usability and professional appearance.

---

## 3. Objectives

1. Create visual consistency across Categories, Topics, and Scenarios pages
2. Standardize navigation patterns and button styles
3. Align card components for uniform appearance
4. Implement consistent text truncation with tooltip enhancements
5. Apply uniform color schemes for action buttons
6. Standardize filtering and sorting options

---

## 4. Detailed Requirements

### 4.1 Card Component Alignment

#### 4.1.1 Card Title Standardization
**Requirement:** All card titles across Categories, Topics, and Scenarios must use the same typography variant.

**Current State:**
- Categories: `variant="h6"` (lines 455-457 in [Categories.tsx](../../src/pages/Categories.tsx#L455-L457))
- Topics: `variant="h5"` (lines 70-72 in [TopicCard.tsx](../../src/components/topics/TopicCard.tsx#L70-L72))
- Scenarios: `variant="h6"` (lines 67-69 in [ScenarioCard.tsx](../../src/components/scenarios/ScenarioCard.tsx#L67-L69))

**Target State:**
- All cards should use `variant="h6"` for titles
- Font weight and size should be consistent
- Color should use default text color

**Acceptance Criteria:**
- [ ] All card titles use Typography variant="h6"
- [ ] Visual appearance is identical across all three card types
- [ ] Text truncation handles long titles consistently

---

### 4.2 Navigation Pattern Updates

#### 4.2.1 Back Button Standardization
**Requirement:** Replace icon-based back buttons with descriptive text buttons.

**Current State:**
- Categories: No back button (root page)
- Topics: IconButton with ArrowBackIcon (lines 598-602 in [CategoryDetails.tsx](../../src/pages/CategoryDetails.tsx#L414-L422))
- Scenarios: IconButton with ArrowBackIcon (lines 598-602 in [TopicDetails.tsx](../../src/pages/TopicDetails.tsx#L598-L602))

**Target State:**
- Topics page: Text button reading "Back to Categories"
- Scenarios page: Text button reading "Back to Topics"
- Use startIcon with ArrowBackIcon for visual clarity
- Maintain consistent styling with `sx={{ textTransform: 'none' }}`

**Current Implementation Reference:**
Topics page already has the correct pattern at lines 414-422 in [CategoryDetails.tsx](../../src/pages/CategoryDetails.tsx#L414-L422):
```tsx
<Button
  startIcon={<ArrowBackIcon />}
  onClick={() => navigate('/categories')}
  sx={{ textTransform: 'none' }}
>
  Back To Categories
</Button>
```

**Acceptance Criteria:**
- [ ] Topics page displays "Back to Categories" text button
- [ ] Scenarios page displays "Back to Topics" text button
- [ ] Both use startIcon with ArrowBackIcon
- [ ] Text styling is consistent with `textTransform: 'none'`
- [ ] Navigation functions correctly when clicked

---

### 4.3 Filtering & Sorting Standardization

#### 4.3.1 Sort By Filter Implementation
**Requirement:** Topics and Categories pages must have identical Sort By filters.

**Current State:**
- Categories: Has Sort By dropdown with 4 options (lines 388-402 in [Categories.tsx](../../src/pages/Categories.tsx#L388-L402))
  - Date Added (Newest)
  - Date Added (Oldest)
  - Name (A-Z)
  - Name (Z-A)
- Topics: No sort functionality
- Scenarios: No sort functionality (correctly, as this won't have sorting)

**Target State:**
- Topics page should have identical Sort By filter as Categories
- Sort options should affect the topic card display order
- Filter should be placed in the same relative position as Categories page

**Implementation Requirements:**
1. Add `sortBy` state variable to CategoryDetails component
2. Add `SortOption` type matching Categories implementation
3. Implement FormControl with Select component
4. Add sorting logic to `filteredTopics` computation
5. Position filter alongside search bar

**Acceptance Criteria:**
- [ ] Topics page has Sort By dropdown
- [ ] Sort options match Categories exactly (Date Newest/Oldest, Name A-Z/Z-A)
- [ ] Sorting functionality works correctly
- [ ] Visual styling matches Categories implementation
- [ ] Scenarios page does NOT have Sort By (intentional exclusion)

#### 4.3.2 Difficulty Filter Removal
**Requirement:** Remove the "Filter by Difficulty" dropdown from Scenarios page.

**Current State:**
- Scenarios page has difficulty filter (lines 657-673 in [TopicDetails.tsx](../../src/pages/TopicDetails.tsx#L657-L673))

**Target State:**
- Remove difficulty filter dropdown
- Remove related state variables (`difficultyFilter`, `uniqueDifficulties`)
- Remove filter chip display (lines 677-686)
- Clean up unused filtering logic

**Acceptance Criteria:**
- [ ] Difficulty filter dropdown is removed
- [ ] No related state variables remain
- [ ] Filter chip section is removed
- [ ] Scenarios display all difficulties without filtering

---

### 4.4 Button Color Standardization

#### 4.4.1 Action Button Colors
**Requirement:** Standardize button colors across Topics and Scenarios pages, with specific color assignments for different actions.

**Current State:**
- Categories: Uses `color="warning"` (amber) for VIEW TOPICS and EDIT buttons (lines 477-493 in [Categories.tsx](../../src/pages/Categories.tsx#L477-L493))
- Topics: Uses default button colors (lines 92-119 in [TopicCard.tsx](../../src/components/topics/TopicCard.tsx#L92-L119))
- Scenarios: Uses default button colors (lines 80-105 in [ScenarioCard.tsx](../../src/components/scenarios/ScenarioCard.tsx#L80-L105))

**Target State:**

**Topics Page Buttons:**
- View Scenarios button: `color="warning"` (secondary amber)
- Edit button: `color="warning"` (secondary amber)
- Delete button: `color="error"` (error red)

**Scenarios Page Buttons:**
- Rubrics button: `color="warning"` (secondary amber)
- Edit button: `color="warning"` (secondary amber)
- Delete button: `color="error"` (error red)

**Implementation Requirements:**
1. Update TopicCard component button colors
2. Update ScenarioCard component button colors
3. Maintain button variant (likely "text" or "contained" - needs design decision)
4. Ensure hover states work correctly with new colors

**Acceptance Criteria:**
- [ ] All primary action buttons use warning (amber) color
- [ ] All delete buttons use error (red) color
- [ ] Button colors are consistent across Topics and Scenarios
- [ ] Hover states and accessibility are maintained

---

### 4.5 Topic Card Enhancements

#### 4.5.1 Remove Role Chip
**Requirement:** Remove the Role chip from Topic cards.

**Current State:**
- TopicCard displays Role chip (lines 83-88 in [TopicCard.tsx](../../src/components/topics/TopicCard.tsx#L83-L88))

**Target State:**
- Role chip should be removed entirely
- Only "X Scenarios" chip should remain
- Card layout should adjust to single chip display

**Acceptance Criteria:**
- [ ] Role chip is removed from TopicCard
- [ ] Only scenario count chip is displayed
- [ ] Card spacing and layout look balanced
- [ ] No broken references to userRole prop

#### 4.5.2 Text Truncation with Tooltip
**Requirement:** Implement two-line text truncation with "... more" link and tooltip showing complete details plus role.

**Current State:**
- TopicCard truncates at 120 characters (line 74 in [TopicCard.tsx](../../src/components/topics/TopicCard.tsx#L74))
- No tooltip functionality
- Role displayed as chip, not in tooltip

**Target State:**
- Display exactly two lines of overview text
- After two lines, show "... more" where "more" is styled in primary blue
- Hovering over "more" shows tooltip with:
  - Complete topic details text
  - User role appended as "Your role: [role]"

**Implementation Requirements:**
1. Replace simple string truncation with CSS-based multi-line truncation
2. Implement Tooltip component from MUI
3. Style "more" text with primary color
4. Construct tooltip content with full overview + role
5. Handle edge cases (very short text, missing role, etc.)

**CSS Implementation:**
```tsx
<Typography
  variant="body2"
  color="text.secondary"
  sx={{
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    mb: 2
  }}
>
  {overview}
  {shouldShowMore && (
    <Tooltip title={`${overview}\n\nYour role: ${userRole}`}>
      <Typography
        component="span"
        color="primary"
        sx={{ cursor: 'pointer', ml: 0.5 }}
      >
        ... more
      </Typography>
    </Tooltip>
  )}
</Typography>
```

**Acceptance Criteria:**
- [ ] Text displays exactly two lines before truncation
- [ ] "... more" appears only when text exceeds two lines
- [ ] "more" text is styled in primary blue color
- [ ] Hovering over "more" displays tooltip
- [ ] Tooltip shows complete overview text
- [ ] Tooltip includes "Your role: [role]" at the end
- [ ] Tooltip is readable and well-formatted

---

### 4.6 Scenario Card Enhancements

#### 4.6.1 Text Truncation with Tooltip
**Requirement:** Implement two-line text truncation with "... more" link and tooltip showing complete overview.

**Current State:**
- ScenarioCard truncates at 100 characters (line 71 in [ScenarioCard.tsx](../../src/components/scenarios/ScenarioCard.tsx#L71))
- No tooltip functionality

**Target State:**
- Display exactly two lines of overview text
- After two lines, show "... more" where "more" is styled in primary blue
- Hovering over "more" shows tooltip with complete scenario overview

**Implementation Requirements:**
1. Replace simple string truncation with CSS-based multi-line truncation
2. Implement Tooltip component from MUI
3. Style "more" text with primary color
4. Handle edge cases (very short text, missing overview, etc.)

**CSS Implementation:**
```tsx
<Typography
  variant="body2"
  color="text.secondary"
  sx={{
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    mb: 2
  }}
>
  {overview}
  {shouldShowMore && (
    <Tooltip title={overview}>
      <Typography
        component="span"
        color="primary"
        sx={{ cursor: 'pointer', ml: 0.5 }}
      >
        ... more
      </Typography>
    </Tooltip>
  )}
</Typography>
```

**Acceptance Criteria:**
- [ ] Text displays exactly two lines before truncation
- [ ] "... more" appears only when text exceeds two lines
- [ ] "more" text is styled in primary blue color
- [ ] Hovering over "more" displays tooltip
- [ ] Tooltip shows complete overview text
- [ ] Tooltip is readable and well-formatted

---

## 5. Component File Changes

### Files to Modify:

1. **[CategoryDetails.tsx](../../src/pages/CategoryDetails.tsx)** (Topics Page)
   - Add Sort By filter logic and UI
   - Ensure "Back to Categories" text button is properly implemented
   - Update search bar styling for consistency

2. **[TopicDetails.tsx](../../src/pages/TopicDetails.tsx)** (Scenarios Page)
   - Change IconButton back navigation to text button "Back to Topics"
   - Remove difficulty filter dropdown and related code
   - Remove difficulty filter chip display

3. **[TopicCard.tsx](../../src/components/topics/TopicCard.tsx)**
   - Update title to variant="h6"
   - Remove Role chip from card display
   - Implement two-line truncation with "... more" tooltip
   - Update button colors (warning for View/Edit, error for Delete)
   - Keep userRole prop for tooltip use

4. **[ScenarioCard.tsx](../../src/components/scenarios/ScenarioCard.tsx)**
   - Ensure title is variant="h6"
   - Implement two-line truncation with "... more" tooltip
   - Update button colors (warning for Rubrics/Edit, error for Delete)

---

## 6. Design Specifications

### 6.1 Typography
- **Card Titles:** Material-UI `variant="h6"`
- **Card Body Text:** Material-UI `variant="body2"`
- **"more" Link:** Material-UI `color="primary"`, cursor: pointer

### 6.2 Colors (Material-UI Theme)
- **Primary Actions:** `color="warning"` (Amber/Orange secondary color)
- **Delete Actions:** `color="error"` (Red error color)
- **Primary Links:** `color="primary"` (Blue primary color)

### 6.3 Button Styles
- **Primary Actions:** Amber color, standard button size
- **Delete Actions:** Red color, standard button size
- **Back Buttons:** Text button with startIcon, no text transform

### 6.4 Card Layout
- **Consistent Heights:** All cards should flex to fill grid space
- **Hover Effects:** Consistent elevation and transform effects
- **Spacing:** Uniform padding and margins

### 6.5 Tooltips
- **Topics:** Multi-line, shows full overview + "Your role: [role]"
- **Scenarios:** Multi-line, shows full overview only
- **Styling:** Default Material-UI tooltip styling

---

## 7. User Stories

### US-1: Consistent Card Experience
**As an** Admin or Manager
**I want** all cards (Categories, Topics, Scenarios) to look visually similar
**So that** I have a consistent browsing experience across the application

**Acceptance Criteria:**
- All card titles use the same typography
- Cards have consistent hover effects
- Button placement and styling is uniform

### US-2: Clear Navigation
**As an** Admin or Manager
**I want** clear text-based back buttons
**So that** I always know where I'm navigating back to

**Acceptance Criteria:**
- Topics page shows "Back to Categories"
- Scenarios page shows "Back to Topics"
- Navigation works correctly

### US-3: Consistent Sorting
**As an** Admin or Manager
**I want** the same sorting options on Categories and Topics pages
**So that** I can organize content the same way across both views

**Acceptance Criteria:**
- Both pages have identical Sort By filters
- Sorting behaves the same way on both pages

### US-4: Quick Content Preview
**As an** Admin or Manager
**I want** to see a preview of long text with the option to see more
**So that** I can quickly scan content and dive deeper when needed

**Acceptance Criteria:**
- Cards show two lines of text before truncating
- "... more" link appears when text is truncated
- Hovering shows full content in tooltip

### US-5: Clear Action Buttons
**As an** Admin or Manager
**I want** action buttons to use consistent colors
**So that** I can quickly identify different types of actions (view, edit, delete)

**Acceptance Criteria:**
- Primary actions use amber color
- Delete actions use red color
- Colors are consistent across all pages

---

## 8. Implementation Plan

### Phase 1: Card Component Updates
1. Update TopicCard component
   - Title typography
   - Remove Role chip
   - Add text truncation with tooltip
   - Update button colors

2. Update ScenarioCard component
   - Verify title typography
   - Add text truncation with tooltip
   - Update button colors

### Phase 2: Navigation Updates
1. Update TopicDetails (Scenarios page)
   - Change back button to text button
   - Remove difficulty filter

2. Verify CategoryDetails (Topics page)
   - Ensure back button is text-based

### Phase 3: Filtering & Sorting
1. Add Sort By to CategoryDetails (Topics page)
   - Implement state management
   - Add UI components
   - Wire up sorting logic

### Phase 4: Testing & QA
1. Visual regression testing
2. Functionality testing
3. Cross-browser testing
4. Accessibility testing

---

## 9. Testing Requirements

### 9.1 Visual Testing
- [ ] All three pages display side-by-side in browser
- [ ] Card heights and widths are consistent
- [ ] Typography sizes match exactly
- [ ] Button colors are correct
- [ ] Hover effects work consistently

### 9.2 Functional Testing
- [ ] Back navigation works correctly on both pages
- [ ] Sort By filter works on Categories and Topics
- [ ] Tooltips display on hover
- [ ] "... more" appears only when text exceeds two lines
- [ ] All buttons perform correct actions
- [ ] Search functionality still works on all pages

### 9.3 Edge Case Testing
- [ ] Cards with very long titles
- [ ] Cards with very short descriptions (< 2 lines)
- [ ] Cards with missing optional data
- [ ] Empty states (no cards)
- [ ] Single card in grid
- [ ] Many cards (20+) in grid

### 9.4 Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible
- [ ] Tooltips are accessible

---

## 10. Success Metrics

1. **Visual Consistency Score:** 100% alignment of UI components
2. **User Feedback:** Positive feedback on unified experience
3. **Development Time:** No regressions introduced
4. **Performance:** No degradation in page load times
5. **Accessibility:** WCAG 2.1 AA compliance maintained

---

## 11. Dependencies

### Technical Dependencies
- Material-UI (MUI) v5.x
- React Router v6.x
- Supabase client
- TypeScript

### Design Dependencies
- Material-UI theme configuration
- Color palette definitions
- Typography scale

### Team Dependencies
- Frontend developers for implementation
- QA team for testing
- Design team for final approval

---

## 12. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing functionality | High | Low | Comprehensive testing suite |
| Performance degradation from tooltips | Medium | Low | Use MUI optimized components |
| Accessibility issues with "more" links | Medium | Medium | Proper ARIA labels and testing |
| Inconsistent behavior across browsers | Low | Low | Cross-browser testing |
| State management complexity with sorting | Medium | Low | Follow existing patterns from Categories |

---

## 13. Open Questions

1. Should the "View Scenarios" / "Rubrics" buttons be contained or text buttons?
   - **Recommendation:** Match Categories page button variant

2. Should cards have a maximum width on large screens?
   - **Current State:** Cards grow to fill grid space
   - **Recommendation:** Keep current behavior for consistency

3. Should tooltips have a delay before appearing?
   - **Recommendation:** Use MUI default (500ms)

4. Should the role information be completely hidden or just moved to tooltip?
   - **Decision:** Move to tooltip (per requirements)

---

## 14. Future Enhancements (Out of Scope)

The following items are noted for future consideration but are NOT part of this PRD:

1. Unified card action menu (kebab menu)
2. Bulk selection and actions
3. Drag-and-drop reordering
4. Card view / list view toggle
5. Advanced filtering (multi-select, date ranges, etc.)
6. Card animations and transitions
7. Customizable card layouts
8. Quick edit inline capabilities

---

## 15. Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Manager | | | |
| Engineering Lead | | | |
| Design Lead | | | |
| QA Lead | | | |

---

## 16. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-04 | Claude | Initial draft |

---

## 17. Appendix

### A. Current Implementation Screenshots
(To be added: Screenshots of current state for each page)

### B. Mockups / Wireframes
(To be added: Visual designs for aligned pages)

### C. Code Snippets
Referenced throughout the document with file paths and line numbers.

### D. Related Documentation
- [Stage 1 Setup Documentation](../stage-1-setup/)
- [E2E Testing Documentation](../stage-1-setup/e2e-testing.md)
- Material-UI Documentation: https://mui.com/

---

**Document Status:** Draft - Ready for Review
**Next Steps:** Review by stakeholders → Approval → Implementation → Testing → Deployment
