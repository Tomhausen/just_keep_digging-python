//  spirtes
let me = sprites.create(assets.image`me`, SpriteKind.Player)
controller.moveSprite(me)
me.z = 10
//  setup 
scene.setTileMapLevel(assets.tilemap`outside`)
tiles.placeOnTile(me, tiles.getTileLocation(6, 2))
scene.cameraFollowSprite(me)
info.setScore(0)
music.setVolume(20)
//  vars
let capacity = 10
let rock_mine_time = 300
let bag : string[] = []
let metal_tiles = [assets.tile`iron`, assets.tile`copper`, assets.tile`silver`, assets.tile`gold`]
let metals = ["iron", "copper", "silver", "gold"]
let tile_names = Dictionary.create(metal_tiles, metals)
let metal_value = Dictionary.create(metals, [50, 200, 500, 1000])
let mine_time = Dictionary.create(metals, [1000, 1500, 4000, 7500])
let costs = Dictionary.create(["Bag capacity: "], [5000])
function generate_cave() {
    for (let tile of tiles.getTilesByType(assets.tile`rock`)) {
        if (randint(1, 50) == 1 && tile.row < 50) {
            tiles.setTileAt(tile, assets.tile`gold`)
        } else if (randint(1, 30) == 1 && tile.row < 75) {
            tiles.setTileAt(tile, assets.tile`silver`)
        } else if (randint(1, 20) == 1) {
            tiles.setTileAt(tile, assets.tile`copper`)
        } else if (randint(1, 5) == 1) {
            tiles.setTileAt(tile, assets.tile`iron`)
        }
        
    }
    tiles.setTileAt(tiles.getTileLocation(randint(1, 98), 1), assets.tile`diamond`)
    tilesAdvanced.setWallOnTilesOfType(assets.tile`diamond`, false)
}

scene.onOverlapTile(SpriteKind.Player, assets.tile`entrance`, function enter(me: Sprite, entrance: tiles.Location) {
    scene.setTileMapLevel(assets.tilemap`cave`)
    tiles.placeOnRandomTile(me, assets.tile`exit`)
    me.y -= 16
    generate_cave()
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`exit`, function exit(me: Sprite, exit: tiles.Location) {
    scene.setTileMapLevel(assets.tilemap`outside`)
    tiles.placeOnRandomTile(me, assets.tile`entrance`)
    me.y += 16
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`sell`, function collide_with_chest(me: Sprite, location: tiles.Location) {
    timer.background(function sell() {
        for (let item of bag) {
            info.changeScoreBy(Dictionary.get_value(metal_value, item))
            bag.removeElement(item)
            pause(500)
        }
    })
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`buy`, function open_shop(me: Sprite, location: tiles.Location) {
    let value: number;
    tiles.placeOnTile(me, me.tilemapLocation())
    controller.moveSprite(me, 0, 0)
    let shop = []
    for (let key of Dictionary.get_keys_list(costs)) {
        value = Dictionary.get_value(costs, key)
        shop.push(miniMenu.createMenuItem(key + ("" + value)))
    }
    shop.push(miniMenu.createMenuItem("Exit"))
    let menu = miniMenu.createMenuFromArray(shop)
    menu.z = 100
    menu.setTitle("UPGRADES")
    menu.setFlag(SpriteFlag.RelativeToCamera, true)
    menu.onButtonPressed(controller.A, function buy(selection: string, selection_index: number) {
        let capacity: number;
        sprites.destroyAllSpritesOfKind(SpriteKind.MiniMenu)
        controller.moveSprite(me)
        let cost = Dictionary.get_values_list(costs)[selection_index]
        if (selection_index == 0) {
            if (info.score() >= cost) {
                info.changeScoreBy(-cost)
                capacity = Math.round(capacity * 1.33)
                me.say("Yay, I got it!", 3000)
                Dictionary.replaceValue(costs, Dictionary.get_keys_list(costs)[0], cost * 2)
            } else {
                me.say("I don't have enough money", 3000)
            }
            
        }
        
    })
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`diamond`, function win() {
    game.over(true)
})
function get_direction(): number {
    if (controller.up.isPressed()) {
        return CollisionDirection.Top
    } else if (controller.down.isPressed()) {
        return CollisionDirection.Bottom
    } else if (controller.left.isPressed()) {
        return CollisionDirection.Left
    } else if (controller.right.isPressed()) {
        return CollisionDirection.Right
    }
    
    return -1
}

function mine(location: any) {
    let metal: number;
    if (bag.length >= capacity) {
        me.say("I can't carry any more", 3000)
        return
    }
    
    controller.moveSprite(me, 0, 0)
    let pause_time = rock_mine_time
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0) {
        metal = Dictionary.get_value(tile_names, tiles.tileImageAtLocation(location))
        pause_time = Dictionary.get_value(mine_time, metal)
        bag.push("" + metal)
    }
    
    pause(pause_time)
    controller.moveSprite(me)
    tiles.setTileAt(location, assets.tile`floor`)
    tiles.setWallAt(location, false)
}

controller.A.onEvent(ControllerButtonEvent.Pressed, function attempt_mine() {
    let location = me.tilemapLocation().getNeighboringLocation(get_direction())
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0 || tiles.tileAtLocationEquals(location, assets.tile`rock`)) {
        mine(location)
    }
    
})
