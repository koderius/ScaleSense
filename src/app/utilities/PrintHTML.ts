// import * as pdfcrowd from 'pdfcrowd'
// import * as pdf from 'html-pdf';
// import * as puppeteer from 'puppeteer';
// import * as firebase from 'firebase';

export class PrintHTML {

  static async PrintHTML(html: string) {

    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(`
    //   <!DOCTYPE html>
    //   <html>
    //     <head>
    //       <meta charset="utf-8" />
    //       <meta http-equiv="X-UA-Compatible" content="IE=edge">
    //       <title>${data.html}</title>
    //       <meta name="viewport" content="width=device-width, initial-scale=1">
    //     </head>
    //     <body>
    //       <div>
    //           <p>${data.title}</p>
    //       </div>
    //     </body>
    //   </html>
    // `);

    // pdf.create(html).toFile('./test.pdf',(err, res)=>{
    //   console.log(res);
    // });

    // const fn = firebase.functions().httpsCallable('generatePdf');
    // const buffer = (await fn({html: html, title: 'test page'})).data;
    // console.log(buffer);
    //
    //
    // const blob = new Blob([buffer], {type: "application/pdf"});
    //
    // const obj = window.URL.createObjectURL(blob);
    // window.open(obj);

    // const link = document.createElement('a');
    // link.href = window.URL.createObjectURL(blob);
    // link.download = `your-file-name.pdf`;
    // link.click();

    // // create the API client instance
    // const client = new pdfcrowd.HtmlToPdfClient("mestroti", "4dfc949c3e86475acd47a76f7acce0d7");
    //
    // // run the conversion and write the result to a file
    // client.convertStringToFile(
    //   html,
    //   "report-table.pdf",
    //   function(err, fileName) {
    //     if (err) return console.error("Pdfcrowd Error: " + err);
    //     console.log("Success: the file was created " + fileName);
    //   });

    // html2pdf()
    //   .set({
    //     margin: 6,
    //     filename: 'report_table.pdf',
    //     jsPDF: { orientation: 'landscape' }
    //   })
    //   .from(document.querySelector('table')).to('pdf').output('dataurlnewwindow');

    // Create hidden iframe element
    const iframe: HTMLIFrameElement = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    // Write HTML into its content
    iframe.contentDocument.write(html);
    // Call print to its content
    const win = iframe.contentWindow;
    win.focus();
    win.print();
    // Remove the iframe
    setTimeout(function(){
      iframe.remove();
    },3000);

  }

}
