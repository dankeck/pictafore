import DOMPurify from 'dompurify';
export default (translate) =>
  async function googleTranslateHTML(html, to, from = "auto") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const nodes = doc.body.childNodes;
    function isInline(node) {
      return !node || node.nodeType !== Node.ELEMENT_NODE || getComputedStyle(node).display.startsWith("inline");
    }
    function getAttributes(element) {
      const attributes = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attribute = element.attributes[i];
        attributes[attribute.name] = attribute.value;
      }
      return attributes;
    }
    const parser = new DOMParser();
    let nodeIdCounter = 0;
    function flattenNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.setAttribute("data-id", nodeIdCounter++);
        let tag = {
          tagName: node.tagName,
          attributes: getAttributes(node),
        };
        if (node.childNodes.length < 1) {
          node.appendChild(doc.createTextNode(""));
        }
        return [
          { tag, open: true },
          ...[...node.childNodes].map((e) => flattenNode(e)),
          { close: true },
        ].flat();
      } else if (node.nodeType === node.TEXT_NODE) {
        return node.data;
      }
    }
    const flattenedWithTags = [...nodes].map((e) => flattenNode(e)).flat();
    let tagStack = [];
    let counter = 0;
    let tagStacks = {};
    let numberified = [];
    for (let e of flattenedWithTags) {
      if (typeof e === "object") {
        if (e.open) {
          tagStack.push(e.tag);
        } else if (e.close) {
          tagStack.pop();
        }
      } else {
        let id = counter++;
        tagStacks[id] = [...tagStack].reverse();
        e = new Option(e).innerHTML.replace(/(&[^;]+;)/g, "<a>$1</a>");
        numberified.push(
          tagStack.length > 0 ? ["<a i=" + id + ">", e, "</a>"] : [e]
        );
      }
    }
    const translated = await translate(
      numberified.flat().join("")+"<a></a>",
      to,
      from
    );
    const translatedDoc = parser.parseFromString(translated.text.replace(/<\s+a([\s>])/g,"<a$1"), "text/html");
    const translatedFlattenedWithTags = [...translatedDoc.body.childNodes]
      .map((e) => flattenNode(e))
      .flat();
    const out = [];
    tagStack = [];
    for (let e of translatedFlattenedWithTags) {
      if (typeof e === "object") {
        if (e.open) {
          tagStack.push(e.tag);
        } else if (e.close) {
          tagStack.pop();
        }
      } else {
        if (tagStack.length < 1) {
          out.push(e);
        } else {
          const id = tagStack[0].attributes.i;
          let t = e;
          const rtags = id ? tagStacks[id] : [];
          for (let tag of rtags) {
            const newLayer = translatedDoc.createElement(tag.tagName);
            for (let attr in tag.attributes)
              newLayer.setAttribute(attr, tag.attributes[attr]);
            newLayer.append(t);
            t = newLayer;
          }
          out.push(t);
        }
      }
    }
    function mergeSiblingElements(node) {
      // base case: if the node has no siblings, return the node
      if (!node.nextSibling) {
        return node;
      }
      // check if the node and its sibling have the same data-id attribute
      const nodeInline = isInline(node);
      while (
        node.nextSibling.nodeType === Node.TEXT_NODE &&
        nodeInline?node.nextSibling.data=="":!node.nextSibling.data.trim()
      ) {
        node.nextSibling.remove();
        if (!node.nextSibling) {
          return node;
        }
      }
      if (
        node.nextSibling.nodeType === Node.ELEMENT_NODE &&
        node.nodeType === Node.ELEMENT_NODE &&
        node.getAttribute("data-id") ===
          node.nextSibling.getAttribute("data-id")
      ) {
        // if they do, merge the sibling into the node by moving all of its child nodes into the node
        while (node.nextSibling.firstChild) {
          node.appendChild(node.nextSibling.firstChild);
        }
        // remove the sibling from the DOM
        node.parentNode.removeChild(node.nextSibling);
        // call the function again with the node as the argument, to check for any further siblings with the same data-id attribute
        return mergeSiblingElements(node);
      } else {
        // if the node and its sibling do not have the same data-id attribute, call the function with the sibling as the argument
        return mergeSiblingElements(node.nextSibling);
      }
    }
    const div = document.createElement("div");
    div.append(...out);
    mergeSiblingElements(div.firstChild);
    return {
      html: DOMPurify.sanitize(div.innerHTML),
      detected: translated.detected
    };
  };
