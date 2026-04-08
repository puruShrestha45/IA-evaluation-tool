RUBRICS = {
    "6.2": {
        "title": "6.2 Question Identification",
        "content": """
            <p style="margin-bottom:.4rem"><strong>Binary: FAIL / CORRECT</strong></p>
            <ul>
                <li><strong>CORRECT:</strong> Correct question index and correct main/follow-up flag. Includes cases where the recruiter paraphrased, abbreviated, or combined the question with acknowledgment phrasing.</li>
                <li><strong>FAIL:</strong> Matched question index points to the wrong question. OR main/follow-up flag is wrong (causes wrong tracker update). OR no match returned when the recruiter used a clear paraphrase of a planned question.</li>
            </ul>
            <p style="margin-top:.5rem;font-size:.78rem;color:var(--text-mid)"><em>Note: if no match is returned and the classifier defaults to the currently active question as a fallback, evaluate whether the fallback is the correct question. If correct → CORRECT. If wrong → FAIL.</em></p>
        """
    },
    "6.3": {
        "title": "6.3 Out of Plan Detection Accuracy",
        "content": """
            <p style="margin-bottom:.4rem"><strong>3-level: FAIL / PARTIAL / CORRECT</strong></p>
            <ul>
                <li><strong>CORRECT:</strong> Correct subtype (Follow-up vs New Question) AND detected skills accurately reflect what the recruiter was probing.</li>
                <li><strong>PARTIAL:</strong> Subtype is correct but detected skills are vague, overly broad, or missing the specific competency the recruiter was targeting.</li>
                <li><strong>FAIL:</strong> Wrong subtype. OR detected skills list is empty or describes the wrong competency.</li>
            </ul>
            <p style="margin-top:.5rem;font-size:.78rem;color:var(--text-mid)"><strong>Subtype rules:</strong></p>
            <ul style="font-size:.78rem;color:var(--text-mid)">
                <li><em>Out of Plan Follow-up:</em> Recruiter's question must directly address the <em>same specific skill domain</em> as the active question. Broad thematic similarity is not enough.</li>
                <li><em>Out of Plan New Question:</em> Used when skills do not directly overlap with the active question. Default when overlap is ambiguous.</li>
            </ul>
        """
    },
    "6.4": {
        "title": "6.4 Transcript Split Handling",
        "content": """
            <p style="margin-bottom:.4rem"><strong>Binary: FAIL / CORRECT &nbsp;⚠ VETO</strong></p>
            <ul>
                <li><strong>CORRECT:</strong> At most one part of a split turn returns "New Question". Subsequent chunks of the same turn return "Continuation".</li>
                <li><strong>FAIL (VETO):</strong> Both parts of a split turn return "New Question" — same question counted twice, question index and timer reset fire twice.</li>
            </ul>
            <p style="margin-top:.5rem;font-size:.78rem;color:var(--text-mid)"><em>Exception: if the first chunk is a transition phrase ("Let's talk about...") and the second chunk contains the actual question → CORRECT: first is Continuation, second is New Question.</em></p>
        """
    }
}
