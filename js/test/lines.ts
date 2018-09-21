import { LinearScaleModel } from "../src/LinearScaleModel.js";
import { LinearScale } from "../src/LinearScale.js";
import { expect } from 'chai';
import {DummyManager} from './dummy-manager';
import bqplot = require('..');
import {create_model, create_model_bqplot, create_view, create_figure_lines} from './widget-utils'
import * as d3 from 'd3';


describe("lines >", () => {
    beforeEach(async function() {
        this.manager = new DummyManager({bqplot: bqplot});
    });

    it("create 1d", async function() {
        let x = {dtype: 'float32', value: new DataView((new Float32Array([0,1])).buffer)}
        let y = {dtype: 'float32', value: new DataView((new Float32Array([2,3])).buffer)}
        let objects = await create_figure_lines(this.manager, x, y);
        let lines = objects.lines;
        let data = lines.d3el.selectAll(".curve").data()
        expect(data[0].values[0].x).to.equal(0)
        expect(data[0].values[1].x).to.equal(1)
        expect(data[0].values[0].y).to.equal(2)
        expect(data[0].values[1].y).to.equal(3)

        lines.update_line_xy()        
        d3.timer.flush() // this makes sure the animations are all executed
        var paths = lines.d3el.selectAll(".curve path.line")[0].map((el) => el.getAttribute('d'));
        var width = objects.figure.plotarea_width;
        var height = objects.figure.plotarea_height;
        expect(paths).to.deep.equal([`M0,${height}L${width},0`])

    });

    it("create 2d classic", async function() {
        let x = [[0,0.5,1], [0.5, 0.5, 1.]];
        let y = [[2,2.0,3], [2.0, 2.5, 3.]];
        let objects = await create_figure_lines(this.manager, x, y);
        let lines = objects.lines;
        let data = lines.d3el.selectAll(".curve").data()
        expect(data[0].values[0].x).to.equal(0)
        expect(data[0].values[1].x).to.equal(0.5)
        expect(data[0].values[2].x).to.equal(1)
        expect(data[0].values[0].y).to.equal(2)
        expect(data[0].values[1].y).to.equal(2.)
        expect(data[0].values[2].y).to.equal(3)
        expect(data[0].values).to.have.lengthOf(3)

        expect(data[1].values[0].x).to.equal(0.5)
        expect(data[1].values[1].x).to.equal(0.5)
        expect(data[1].values[2].x).to.equal(1.)
        expect(data[1].values[0].y).to.equal(2.0)
        expect(data[1].values[1].y).to.equal(2.5)
        expect(data[1].values[2].y).to.equal(3.)
        expect(data[1].values).to.have.lengthOf(3)

        lines.update_line_xy()        
        d3.timer.flush() // this makes sure the animations are all executed
        var paths = lines.d3el.selectAll(".curve path.line")[0].map((el) => el.getAttribute('d'));
        var width = objects.figure.plotarea_width;
        var height = objects.figure.plotarea_height;
        expect(paths).to.deep.equal([`M0,${height}L${width/2},${height}L${width},0`, `M${width/2},${height}L${width/2},${height/2}L${width},0`])
    });

    it("create 2d binary", async function() {
        let x = {dtype: 'float32', value: new DataView((new Float32Array([0.0,0.5,1.0, 0.5,0.5,1.0])).buffer), shape: [2,3]}
        let y = {dtype: 'float32', value: new DataView((new Float32Array([2.0,2.0,3.0, 2.0,2.5,3.0])).buffer), shape: [2,3]}
        let objects = await create_figure_lines(this.manager, x, y);
        let lines = objects.lines;
        let data = lines.d3el.selectAll(".curve").data()
        expect(data[0].values[0].x).to.equal(0)
        expect(data[0].values[1].x).to.equal(0.5)
        expect(data[0].values[2].x).to.equal(1)
        expect(data[0].values[0].y).to.equal(2)
        expect(data[0].values[1].y).to.equal(2.)
        expect(data[0].values[2].y).to.equal(3)
        expect(data[0].values).to.have.lengthOf(3)

        expect(data[1].values[0].x).to.equal(0.5)
        expect(data[1].values[1].x).to.equal(0.5)
        expect(data[1].values[2].x).to.equal(1.)
        expect(data[1].values[0].y).to.equal(2.0)
        expect(data[1].values[1].y).to.equal(2.5)
        expect(data[1].values[2].y).to.equal(3.)
        expect(data[1].values).to.have.lengthOf(3)

        lines.update_line_xy()        
        d3.timer.flush() // this makes sure the animations are all executed
        var paths = lines.d3el.selectAll(".curve path.line")[0].map((el) => el.getAttribute('d'));
        var width = objects.figure.plotarea_width;
        var height = objects.figure.plotarea_height;
        expect(paths).to.deep.equal([`M0,${height}L${width/2},${height}L${width},0`, `M${width/2},${height}L${width/2},${height/2}L${width},0`])
    });

    it("create 2d binary shared x", async function() {
        let x = {dtype: 'float32', value: new DataView((new Float32Array([0.0,0.5,1.0])).buffer), shape: [3]}
        let y = {dtype: 'float32', value: new DataView((new Float32Array([2.0,2.0,3.0, 2.0,2.5,3.0])).buffer), shape: [2,3]}
        let objects = await create_figure_lines(this.manager, x, y);
        let lines = objects.lines;
        let data = lines.d3el.selectAll(".curve").data()
        expect(data[0].values[0].x).to.equal(0)
        expect(data[0].values[1].x).to.equal(0.5)
        expect(data[0].values[2].x).to.equal(1)
        expect(data[0].values[0].y).to.equal(2)
        expect(data[0].values[1].y).to.equal(2.)
        expect(data[0].values[2].y).to.equal(3)
        expect(data[0].values).to.have.lengthOf(3)

        expect(data[1].values[0].x).to.equal(0.0)
        expect(data[1].values[1].x).to.equal(0.5)
        expect(data[1].values[2].x).to.equal(1.)
        expect(data[1].values[0].y).to.equal(2.0)
        expect(data[1].values[1].y).to.equal(2.5)
        expect(data[1].values[2].y).to.equal(3.)
        expect(data[1].values).to.have.lengthOf(3)

        lines.update_line_xy()        
        d3.timer.flush() // this makes sure the animations are all executed
        var paths = lines.d3el.selectAll(".curve path.line")[0].map((el) => el.getAttribute('d'));
        var width = objects.figure.plotarea_width;
        var height = objects.figure.plotarea_height;
        expect(paths).to.deep.equal([`M0,${height}L${width/2},${height}L${width},0`, `M0,${height}L${width/2},${height/2}L${width},0`])
    });


});
