<template>
    <div class="image-upload-container">
        <label class="image-upload" for="file-input">
            <img v-if="imageFile" :src="imageFile" :style="{width: width, height: height, objectFit: 'cover'}" />
            <div v-else style="padding: 1rem; font-size: 12px; color: grey; text-align: center;">{{textPlaceholder}}<br>{{ subTextPlaceholder }}</div>
            <input hidden id="file-input" type="file" ref="image" accept="image/*" @change="onFileChange" />
        </label>
        <div class="action-btn">
            <v-btn v-if="imageFile" @click="removeImage" icon="mdi-close-circle" density="compact" color="red"></v-btn>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ImageUpload',
    props: {
        value: {
            type: String,
            default: null,
        },
        textPlaceholder: {
            type: String,
            default: 'คลิกเพื่อเพิ่มรูปภาพ',
        },
        subTextPlaceholder: {
            type: String,
            default: '',
        },
        width: {
            type: String,
            default: '100%',
        },
        height: {
            type: String,
            default: '100%',
        },
    },
    data() {
        return {
            imageFile: this.value,
        };
    },
    emits: ['changed'],
    methods: {
        onFileChange(e) {
            const files = e.target.files || e.dataTransfer.files;
            if (!files.length) return;
            this.createImage(files[0]);
        },
        createImage(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imageFile = e.target.result;
                this.$emit('changed', this.imageFile);
            };
            reader.readAsDataURL(file);
        },
        removeImage: function (e) {
            this.imageFile = null;
            this.$refs.image.value = null;
        },
    },
};
</script>

<style>
.image-upload-container {
    display: flex;
    position: relative;
    flex-direction: column;
    border: 1px dashed #ccc;
    border-radius: 10px;
    cursor: pointer;
    min-height: 150px;
    align-items: center;
    justify-content: center;
}
.image-upload {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.action-btn {
    display: flex;
    position: absolute;
    top: 0;
    right: 0;
    margin: 5px;
}
</style>