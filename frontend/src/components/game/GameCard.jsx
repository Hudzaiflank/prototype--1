export function GameCard({ type, state, content }) {
  return (
    <article data-card-type={type} data-card-state={state}>
      {state === "revealed" ? content : "Hidden card"}
    </article>
  );
}
