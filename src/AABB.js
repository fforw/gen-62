export default class AABB {

    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;

    add(x, y)
    {
        this.minX = Math.floor(Math.min(this.minX, x))
        this.minY = Math.floor(Math.min(this.minY, y))
        this.maxX = Math.ceil( Math.max(this.maxX, x))
        this.maxY = Math.ceil( Math.max(this.maxY, y))
    }

    get width()
    {
        return (this.maxX - this.minX) | 0;
    }


    get height()
    {
        return (this.maxY - this.minY) | 0;
    }

    get center()
    {
        return [(this.minX + this.maxX) >> 1, (this.minY + this.maxY) >> 1 ]
    }

    clip(width, height)
    {
        const { minX, minY, maxX, maxY} = this

        if (
            (minX < 0 && maxX < 0) ||
            (minY < 0 && maxY < 0) ||
            (minX >= width && maxX >= width) ||
            (minY >= height && maxY >= height)
        )
        {
            // completely outside
            return null
        }

        const clipped = new AABB()

        clipped.minX = Math.max(minX, 0)
        clipped.minY = Math.max(minY, 0)
        clipped.maxX = Math.min(maxX, width - 1)
        clipped.maxY = Math.min(maxY, height - 1)
        return clipped
    }

    contains(x,y)
    {
        const { minX, minY, maxX, maxY} = this
        return x >= minX && x < maxX && y >= minY && x < maxY
    }

    // grow(n)
    // {
    //     this.minX -= n;
    //     this.minY -= n;
    //     this.maxY += n;
    //     this.maxY += n;
    // }
    //
    // shrink(dir, amount)
    // {
    //     switch(dir)
    //     {
    //         case 0:
    //             this.minX += amount
    //             this.minY += amount
    //             break;
    //         case 1:
    //             this.maxX -= amount
    //             this.minY += amount
    //             break;
    //         case 2:
    //             this.maxX -= amount
    //             this.maxY -= amount
    //             break;
    //         case 3:
    //             this.minX += amount
    //             this.maxY -= amount
    //             break;
    //         default:
    //             throw new Error("Invalid direction: " + dir)
    //     }
    // }
}
