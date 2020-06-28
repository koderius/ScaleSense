export class PrintHTML {

  static PrintHTML(html: string) {

    // Create hidden iframe element
    const iframe: HTMLIFrameElement = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    // Write HTML into its content
    iframe.contentDocument.write(html);
    // Call print to its content
    iframe.contentWindow.print();
    // Remove the iframe
    setTimeout(function(){
      iframe.remove();
    },3000);

  }

}
