function numberOrNullProp(props, propName, componentName) {
  if ('undefined' === typeof props[propName]) {
    return new Error(
      `${componentName} missing required prop '${propName}'`
    );
  }

  if (props[propName] !== null && 'number' !== typeof props[propName]) {
    return new Error(
      `Invalid prop '${propName}' supplied to ${componentName}. Expected null or number`
    );
  }
};

module.exports = numberOrNullProp;
