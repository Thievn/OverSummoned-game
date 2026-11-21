import { WaitlistForm } from './WaitlistForm.jsx';

export function Close() {
  return (
    <footer className="close" id="waitlist">
      <div className="close-inner">
        <p className="index">06</p>
        <h2>Ten thousand heroes. One bad idea.</h2>
        <p className="regret">
          The Hero Office regrets to inform you that your selection as the Chosen One has been filed under miscellaneous,
          between a rat bite and a lost glove. The summoning is not reversible. The fruit basket was a metaphor.
          Leave an address anyway.
        </p>
        <WaitlistForm idPrefix="foot" />
        <p className="colophon">
          OverSummoned. Aldermere. Crowns are not legal tender where you came from.
        </p>
      </div>
    </footer>
  );
}
