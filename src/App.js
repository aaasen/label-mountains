import React, { Component } from 'react';
import _ from 'lodash';
import './App.css';

const ImagePath = '/images/chair.jpg';

// Pixels from top to place the label.
const LabelOffset = 800;
const LabelFontSize = "80px";
const LabelRotation = -45;
const LabelLineWidth = 2;

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      labels : JSON.parse(localStorage.getItem(ImagePath)) || []
    };

    getDataURI(ImagePath).then(image => this.setState({ image }));

    this.handleImageClick = this.handleImageClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.downloadSVG = this.downloadSVG.bind(this);
  }

  getSVGPoint(event) {
    const point = this.svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  handleImageClick(event) {
    const name = prompt('Name');
    if (_.isEmpty(name)) return;

    const labels = this.state.labels.slice();
    const point = this.getSVGPoint(event);
    labels.push({
      name,
      x: point.x,
      y: point.y,
      labelX: point.x,
      labelY: point.y - 300 
    });
    this.setState({ labels });
  }

  selectLabel(index) {
    this.setState({
      selectedLabelIndex: index,
    });
  }

  handleMouseMove(event) {
    if (this.state.selectedLabelIndex === undefined) return;

    const point = this.getSVGPoint(event);
    const labels = this.state.labels.slice();
    labels[this.state.selectedLabelIndex] = Object.assign({}, this.state.labels[this.state.selectedLabelIndex], {
      labelX: point.x,
      labelY: point.y
    });
    this.setState({labels});
  }

  handleMouseUp() {
    this.setState({
      selectedLabelIndex: undefined
    });
  }

  downloadSVG() {
    const svgString = new XMLSerializer().serializeToString(this.svg);
    const canvas = document.createElement('canvas');
    canvas.width = this.state.image.width;
    canvas.height = this.state.image.height;
    const ctx = canvas.getContext('2d');
    const svg = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svg);
    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 0, 0);
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'mountain.jpeg';
        downloadLink.click();
      }, 'image/jpeg', 1.0);
    };
    image.src = url;
  }

  removeLabel(index) {
    if (window.confirm(`Delete label "${this.state.labels[index].name}"?`)) {
      const labels = this.state.labels.slice();
      labels.splice(index, 1);
      this.setState({labels});
    }
  }

  editLabelName(index) {
    const name = prompt('Name');
    if (_.isEmpty(name)) return;
    const labels = this.state.labels.slice();
    labels[index] = Object.assign({}, this.state.labels[index], {name});
    this.setState({labels});
  }

  render() {
    const {image} = this.state;

    if (!image) return null;

    return (
      <div className="App">
        <div onClick={this.downloadSVG}>
          Download
        </div>

        <table className="label-table">
          <tbody>
            {this.state.labels.map(({name}, index) => {
              return (
                <tr key={index} className="label-row">
                  <td>
                    {index + 1}
                  </td>

                  <td className="label-row-name">
                    {name}
                  </td>

                  <td>
                    <span onClick={() => this.removeLabel(index)}>
                      Remove
                    </span>
                  </td>

                  <td>
                    <span onClick={() => this.editLabelName(index)}>
                      Edit
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <svg
          ref={node => this.svg = node}
          width={image.width}
          height={image.height}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}>

          <defs>
            <linearGradient id="linear" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 0, 0, 0)"/>
              <stop offset="20%" stopColor="rgba(0, 0, 0, 0.5)"/>
              <stop offset="90%" stopColor="rgba(0, 0, 0, 0.5)"/>
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)"/>
            </linearGradient>
          </defs>

          <image href={image.url} width={image.width} height={image.height} onClick={this.handleImageClick}/>

          {this.state.labels.map(({name, x, y, labelX, labelY}, index) => {
            labelY = LabelOffset;
            labelX = x;
            return (
              <g key={index}>
                <text
                  key={index}
                  onMouseDown={() => this.selectLabel(index)}
                  x={labelX}
                  y={labelY}
                  textAnchor="start"
                  transform={`rotate(${LabelRotation}, ${labelX}, ${labelY})`}
                  fontSize={LabelFontSize}>

                  {name}
                </text>

                <rect
                  x={x}
                  y={labelY}
                  width={LabelLineWidth}
                  height={y - labelY}
                  fill="url(#linear)"/>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  componentDidUpdate() {
    localStorage.setItem(ImagePath, JSON.stringify(this.state.labels));
  }
}

function getDataURI(url) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;
      canvas.getContext('2d').drawImage(this, 0, 0);
      const url = canvas.toDataURL('image/jpeg');
      resolve({width: this.width, height: this.height, url});
    }
    image.src = url;
  });
}
