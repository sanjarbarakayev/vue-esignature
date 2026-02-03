<script setup lang="ts">
import DemoWidget from "./DemoWidget.vue";
import ESignatureWidget from "../../../../src/components/demos/ESignatureWidget.vue";
import type { Certificate } from "../../../../src/types";

const documentContent =
  "This is a sample document that demonstrates the signing workflow. The E-IMZO digital signature system provides cryptographic proof of document integrity and signer identity.";

function handleSigned(signature: string, certificate: Certificate) {
  alert(
    `Document signed!\nSigner: ${certificate.CN}\nSignature length: ${signature.length} characters`
  );
}

function handleError(error: Error) {
  console.error("Signing error:", error);
}
</script>

<template>
  <DemoWidget
    title="Document Signing"
    description="Complete signing workflow with certificate selection"
    :mock-mode="true"
    :centered="true"
  >
    <template #default>
      <ESignatureWidget
        :content="documentContent"
        document-title="Sample Agreement"
        locale="en"
        :show-preview="true"
        :allow-multiple="true"
        @signed="handleSigned"
        @error="handleError"
        @cancel="() => {}"
      />
    </template>
  </DemoWidget>
</template>
