<template>
  <v-dialog v-model="visible" max-width="520" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Token ( {{ title }} )</span>
        <v-btn @click="close" aria-label="close" icon="mdi-close" size="small" color="primary" variant="text"/>
      </v-card-title>

      <v-card-text>
        <v-textarea
          v-model="displayText"
          readonly
          auto-grow
          rows="2"
          max-rows="8"
          variant="solo"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          :loading="copying"
          :disabled="copying || !displayText"
          @click="copyText"
          prepend-icon="mdi-content-copy"
          color="primary"
        >
          Copy
        </v-btn>
       
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="2000" color="success" location="top">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-dialog>
</template>

<script>
export default {
  name: "CopyDialog",
  data() {
    return {
      visible: false,
      displayText: "",
      title: "Token",
      copying: false,
      snackbar: false,
      snackbarMessage: "",
    };
  },
  methods: {
    open(text, title = "Token") {
      this.displayText = text;
      this.title = title;
      this.visible = true;
    },
    close() {
      this.visible = false;
    },
    async copyText() {
      this.copying = true;
      try {
        await navigator.clipboard.writeText(this.displayText);
        this.snackbarMessage = "Copied!";
      } catch (err) {
        console.error("Copy failed", err);
        this.snackbarMessage = "Copy failed";
      } finally {
        this.snackbar = true;
        this.copying = false;
      }
    },
  },
};
</script>
