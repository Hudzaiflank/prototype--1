export function SubmissionProgress({ submitted = 0, total = 0 }) {
  return (
    <output>
      {submitted}/{total}
    </output>
  );
}
