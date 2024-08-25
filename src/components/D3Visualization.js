import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3Visualization = ({ steps, currentStep }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', 900)
      .attr('height', 900);

    svg.selectAll('*').remove();

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 38)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#000')
      .style('stroke', 'none');

    const width = 900;
    const height = 900;
    const radius = 400;
    const nodeRadius = 30;

    if (steps.length > 0) {
      const stepData = steps[currentStep];
      const { nodes, lines } = stepData;

      const positionedNodes = nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        return {
          ...node,
          x: width / 2 + radius * Math.cos(angle),
          y: height / 2 + radius * Math.sin(angle),
        };
      });

      if (nodes.length < 30) {
        lines.forEach(line => {
          const source = positionedNodes.find(n => n.id === line.source);
          const target = positionedNodes.find(n => n.id === line.target);

          const angleBetweenNodes = Math.atan2(target.y - source.y, target.x - source.x);
          const separationOffset = 50;

          const controlX = (source.x + target.x) / 2 + separationOffset * Math.sin(angleBetweenNodes);
          const controlY = (source.y + target.y) / 2 - separationOffset * Math.cos(angleBetweenNodes);

          svg.append('path')
            .attr('d', `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`)
            .attr('stroke', 'black')
            .attr('stroke-dasharray', 'none')
            .attr('fill', 'none')
            .attr('class', `link-${line.source}-${line.target}`)
            .attr('marker-end', 'url(#arrowhead)');
        });
      }

      svg.selectAll('circle')
        .data(positionedNodes)
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', nodeRadius)
        .attr('fill', d => d.color)
        .attr('stroke', d => d.isTraitor ? 'red' : 'none')
        .attr('stroke-width', d => d.isTraitor ? 3 : 0)
        .attr('id', d => `node-${d.id}`);

      svg.selectAll('text')
        .data(positionedNodes)
        .enter()
        .append('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'black')
        .text(d => `Node ${d.id}`);
    }

  }, [steps, currentStep]);

  useEffect(() => {
    if (steps.length > 0) {
      const stepData = steps[currentStep];
      if (stepData.nodes?.length < 30) {
        stepData.lines?.forEach(line => {
          d3.select(`.link-${line.source}-${line.target}`)
            .attr('stroke', line.color)
            .attr('stroke-dasharray', line.dashed ? '5,5' : 'none');
        });
      }

      stepData.nodes?.forEach(node => {
        d3.select(`#node-${node.id}`)
          .attr('fill', node.color);
      });
    }
  }, [steps, currentStep]);

  return <svg style={{backgroundColor: '#838383'}} ref={svgRef}></svg>;
};

export default D3Visualization;