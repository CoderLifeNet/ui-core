import { Button } from "@coderlifenet/ui-core";
import DeepButton from "@coderlifenet/ui-core/Button";
import Consumer from "./consumer";

export default function Page() {
  return (
    <>
      <Button>Server root button</Button>
      <DeepButton>Server deep button</DeepButton>
      <Consumer />
    </>
  );
}
