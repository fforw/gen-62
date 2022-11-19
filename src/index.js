import { voronoi } from "d3-voronoi"
import { polygonCentroid } from "d3-polygon"

import domready from "domready"
import "./style.css"
import { randomPaletteWithBlack } from "./randomPalette"
import SimplexNoise from "simplex-noise"
import Color from "./Color"
import AABB from "./AABB"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;
const ARC_STEP = TAU/1000

const config = {
    width: 0,
    height: 0,
    palette: ["#000", "#fff"],
    bg: "#000",
    power: 2,
    power2: 2
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

let noise

const overdraw = 2

function randomPoints()
{
    const { width, height } = config

    const w = Math.round(width * overdraw )
    const h = Math.round(height * overdraw )

    let out = []
    const count = 12 + Math.random() * 8
    for (let i=0; i < count; i++)
    {
        out.push(
            [
                - w/2 + Math.round(Math.random() * w),
                - h/2 + Math.round(Math.random() * h),
            ]
        )
    }
    return out
}

function drawPolygon(polygon)
{
    const { width, height } = config

    const cx = width >> 1
    const cy = height >> 1

    const last = polygon.length - 1
    const [x1, y1] = polygon[last]


    ctx.beginPath()
    ctx.moveTo(
        cx + x1 | 0,
        cy + y1 | 0
    )

    for (let i = 0; i < polygon.length; i++)
    {
        const [x1, y1] = polygon[i]
        ctx.lineTo(cx + x1 | 0, cy + y1 | 0)
    }
    ctx.stroke()
}

function relax(v, pts)
{
    const count = 3 + Math.random() * 3

    for (let i = 0; i < count; i++)
    {
        pts = v(pts).polygons().map(poly => {
            const c = polygonCentroid(poly)
            c[0] |= 0
            c[1] |= 0
            return c
        })
    }
    return pts
}


function randomExcluding(exclusion)
{
    const { palette } = config
    let color
    do
    {
        color = palette[0|Math.random() * palette.length]
    } while (exclusion === color)
    
    return color
}

function logPalette(palette)
{
    console.log("%c\u00a0%c\u00a0%c\u00a0%c\u00a0%c\u00a0%c\u00a0", ...palette.map(c => `color: ${c}; background: ${c};`), "data:", palette)
}


const ns = 0.007

function plotLine(x0, y0, x1, y1)
{
    const { palette, power, power2 } = config


    const linePlotCount = 500 + Math.random() * 2500

    const dx = x1 - x0
    const dy = y1 - y0

    let len = Math.sqrt(dx * dx + dy * dy)
    const f = 1 / len
    const nx = dx * f
    const ny = dy * f

    for (let i = 0; i < linePlotCount; i++)
    {

        let size = Math.round(1 + Math.pow(Math.random(), power2) * 7)

        let n1 = Math.random()
        let n = Math.pow(1 - n1, power)

        let r = Math.pow(Math.random() * (1 - n1), 2) * 1000/(size+2)
        let x3 = x0 + dx * n
        let y3 = y0 + dy * n

        let col = palette[0|Math.random() * palette.length] 
        ctx.fillStyle = Color.from(col).toRGBA(0.5 + Math.random() * 0.5)
        const idx = palette.indexOf(col) * ns * 5
        const nv = noise.noise3D(x3 * ns, y3 * ns, idx )
        const angle = nv * TAU/2 + Math.random() * TAU/8

        const x2 = Math.round(x3 + Math.cos(angle) * r)
        const y2 = Math.round(y3 + Math.sin(angle) * r)

        if (Math.random() < 0.033)
        {
            size *= 4
        }
        ctx.fillRect(
            x2, y2, size, size
        )
    }
}


function squares()
{
    const { width, height, palette} = config

    const p2 = palette.map( c => Color.from(c).toRGBA(0.05))

    const max = Math.max(width, height)

    const s = Math.pow(Math.random(), 0.25) * max/4

    for (let i = 0 ; i < 40; i++)
    {
        ctx.fillStyle = p2[0|Math.random() * p2.length]

        ctx.fillRect(
            Math.round(width * Math.random()),
            Math.round(height * Math.random()),
            s,s
        )

    }
}

let tmp, tmpCtx


function drawCircle(x,y, r, maxWidth)
{

    const { width, height, palette, bg } = config

    const slices = [];
    const count = Math.round(12 + Math.random() * 40)
    for (let i=0; i < count; i++)
    {
        slices.push(Math.random() * TAU)
    }
    slices.sort((a,b) => a - b)

    let prev = slices[slices.length - 1]
    ctx.lineWidth = maxWidth
    for (let i = 0; i < slices.length; i++)
    {
        const a = slices[i]

        const r0 = r * (0.9 +  Math.random() * 0.2)
        ctx.strokeStyle = Color.from(palette[0|Math.random() * palette.length] ).toRGBA(0.5 + Math.random() * 0.5)
        ctx.beginPath()
        ctx.moveTo(
            x + Math.cos(prev) * r0,
            y + Math.sin(prev) * r0
        )
        ctx.arc(
            x,
            y,
            r0,
            prev,
            a,
            false
        )
        ctx.stroke()
        prev = a;
    }

    console.log("SLICES",slices)
}

function prettyAngle(a)
{
    return Math.round(a * 10 / DEG2RAD_FACTOR)/10 + "°"
}


domready(
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        const cx = width >> 1
        const cy = height >> 1

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        tmp = document.createElement("canvas")
        tmp.width = 20
        tmp.height = 20
        tmpCtx = tmp.getContext("2d")

        const paint = () => {

            noise = new SimplexNoise()

            config.power = 0.5 + Math.pow(Math.random(), 0.5) * 1.5
            config.power2 = 1.9 + Math.random() * 0.2

            const palette =  randomPaletteWithBlack()
            config.palette = palette

            logPalette(palette)

            const bg = palette[0]
            ctx.fillStyle = bg;
            ctx.fillRect(0,0, width, height);

            squares()

            const fg = randomExcluding(bg)

            ctx.fillStyle = fg;
            ctx.strokeStyle = fg;

            const w = width * overdraw / 2
            const h = height * overdraw  / 2

            let pts = randomPoints()
            const v = voronoi().extent([[-w,-h], [w, h]])
            pts = relax(v, pts)
            const diagram = v(pts)

            //console.log("DIAGRAM", diagram)

            const { cells, edges } = diagram
            for (let i = 0; i < cells.length; i++)
            {
                const { site, halfedges } = cells[i]

                for (let j = 0; j < halfedges.length; j++)
                {
                    const he = halfedges[j]
                    const [[x2,y2],[x3,y3]] = edges[he]

                    const xm = (x2 + x3) / 2
                    const ym = (y2 + y3) / 2

                    let x0 = cx + site[0]
                    let y0 = cy + site[1]
                    let x1 = cx + xm
                    let y1 = cy + ym
                    plotLine(x0, y0, x1, y1)
                }

                // const n = Math.ceil(Math.pow(Math.random(), 2) * 8)
                // for (let j = 0; j < n; j++)
                {
                    const r = 10 + Math.round(Math.max(width,height) * 0.2 * Math.random())

                    let n = 2 + Math.pow(Math.random(),3) * 20
                    const maxWidth = Math.round(n)
                    drawCircle(cx + site[0], cy + site[1], r, maxWidth)
                }
            }

            //ctx.strokeStyle = palette[palette.length - 1]
            //diagram.polygons().forEach(drawPolygon)
        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
