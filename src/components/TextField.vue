<template>
    <v-text-field v-model="value" :label="label" variant="outlined" density="compact" color="primary"
        :append-inner-icon="type === 'password' ? password_visible ? 'mdi-eye-off' : 'mdi-eye' : null" :type="type"
        @click:append-inner="password_visible = !confirpassword_visiblem_password_visible"
        :rules="[...rules, my_rules.min]"></v-text-field>
</template>

<script>
export default {
    name: "TextField",
    props: {
        label: {
            type: String,
            default: "Label"
        },
        modelValue: {
            type: String,
            default: null
        },
        rules: {
            type: Array,
            default: () => []
        },
        type: {
            type: String,
            default: "text"
        },
        min: {
            type: Number,
            default: null
        },
    },
    emits: ["update:modelValue"],
    computed: {
        value: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        },
        minChar: {
            get() {
                return this.type == 'password' ? 6 : this.min
            },
        }
    },
    data() {
        return {
            password_visible: false,
            my_rules: {
                min: value => this.minChar ? value.length >= this.minChar || `มีอย่างน้อย ${this.minChar} ตัวอักษร`: true
            },

        }
    }
}
</script>