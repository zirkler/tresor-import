import { extractActivity } from '../../src'

var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    activities: [],
  },
  methods: {
    fileHandler() {
      const files = this.$refs.myFiles.files;
      // console.log(files);
      this.processFiles(Array.from(files));
    },
    processFiles(files) {
      files.map(this.createActivityFromPDF);
    },
    async createActivityFromPDF(file) {
      let activity;
      var fileReader = new FileReader();
      fileReader.onload = async e => {
        activity = await extractActivity(e);

        const a = {
          ...activity,
          filename: file.name,
          parsed: true
        };

        console.log(a);
        this.activities.push(a)
      };
      fileReader.readAsArrayBuffer(file);
      return activity;
    },
  }
})