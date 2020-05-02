
export function isTrue(attr) {
  return attr != null && attr.toLowerCase() != 'false'
}

export function isNotSelf(target) {
  return target && target != '_self'
}

const defaultPrefixes = ['data-w-', 'w-', '']

export function getFirst(pairs, { prefixes = defaultPrefixes }) {
  for (const [elem, attr] of pairs) {
    if (elem) {
      for (const prefix of prefixes) {
        const prefixedAttr = prefix + attr
        if (elem.hasAttribute(prefixedAttr)) {
          return elem.getAttribute(prefixedAttr)
        }
      }
    }
  }

  return null
}

export function isSameArray(a, b) {
  if (a === b) {
    return true
  }

  if (!a || !b) {
    return false
  }

  if (a.length != b.length) {
    return false
  }

  for (let i = 0;i < a.length;i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

export function populateProps(node, { suffix = '', prefixes = defaultPrefixes, target = {} }) {
  for (const prefix of prefixes) {
    for (const attr of node.attributes) {
      const pi = attr.name.indexOf(prefix)
      const si = attr.name.indexOf(suffix)
      if (pi == 0 && si == attr.name.length - suffix.length) {
        target[attr.name.slice(pi + prefix.length, si)] = attr.value
      }
    }
  }

  return target
}

export function getAttrList(attr, { prefixes = defaultPrefixes }) {
  const attrList = []

  for (const prefix of prefixes) {
    attrList.push(prefix + attr)
  }

  return attrList
}

export function getFormElementValues(formElement, { prefixes = defaultPrefixes }) {

  if (typeof formElement.getCustomInputValues == 'function') {
    return formElement.getCustomInputValues()
  }

  for (const prefix of prefixes) if (prefix) {
    const attr = prefix + 'value'
    if (formElement.hasAttribute(attr)) {
      return [formElement.getAttribute(attr)]
    }
  }

  if (formElement.files) {
    return formElement.files
  }

  if (formElement.tagName.toLowerCase() == 'select') {
    const values = []

    for (const option of formElement.options) {
      if (option.selected) {
        values.push(option.value)
      }
    }

    return values
  }

  return [formElement.value]
}

export function getFormData(form, { url, whitelist, submitter, prefixes = defaultPrefixes }) {
  let pairs, body

  if (url) {
    pairs = []
  } else {
    body = new FormData()
  }

  let elements = []
  if (typeof form.getCustomInputs === 'function') {
    elements = form.getCustomInputs()
  }

  for (const element of form.elements) {
    elements.push(element)
  }

  for (const element of elements) {
    if (element.hasAttribute('name')) {
      const name = element.getAttribute('name')

      switch (element.type.toLowerCase()) {
        case 'radio':
        case 'checkbox':
          if (!element.checked) {
            continue
          }
          break
        case 'submit':
        case 'image':
          if (submitter !== element) {
            continue
          }
          break
      }

      if (whitelist && whitelist.indexOf(name) == -1) {
        continue
      }

      for (let value of getFormElementValues(element, { prefixes })) {
        if (url) {
          if (window.File && value instanceof window.File) {
            value = value.name
          }

          pairs.push(encodeURIComponent(name) + (value ? '=' + encodeURIComponent(value) : ''))
        } else {
          body.append(name, value)
        }
      }

    }
  }

  if (url) {
    return url.replace(/(\?.*?)?(?=#|$)/, '?' + pairs.join('&'))
  }

  return body
}

export function toQuery(context) {
  const attrs = []

  for (let key in context) if (key.indexOf('_') != 0 && context.hasOwnProperty(key)) {
    const values = context[key] instanceof Array ? context[key] : [context[key]]

    for (let i = 0;i < values.length;i++) {
      const value = values[i]
      attrs.push(encodeURIComponent(key) + (value ? '=' + encodeURIComponent(value) : ''))
    }
  }

  return attrs.join('&')
}

export function compose(...funcs) {
  return (arg, ...rest) => {
    let result = arg
    for (const func of funcs) {
      result = func(result, ...rest)
    }

    return result
  }
}

export function withInit(BaseClass) {
  const inited = new WeakSet()
  return class extends BaseClass {
    constructor() {
      const self = super()

      if (!inited.has(self)) {
        inited.add(self)
        super.init.call(self)
      }

      return self
    }

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback()
      }

      if (!inited.has(this)) {
        inited.add(this)
        super.init.call(this)
      }
    }
  }
}
