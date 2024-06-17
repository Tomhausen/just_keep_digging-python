//  spirtes
let me = sprites.create(assets.image`me`, SpriteKind.Player)
controller.moveSprite(me)
me.z = 10
//  setup
scene.setTileMapLevel(assets.tilemap`outside`)
tiles.placeOnTile(me, tiles.getTileLocation(6, 2))
scene.cameraFollowSprite(me)
info.setScore(100000)
music.setVolume(20)
//  vars
let capacity = 10
let rock_mine_time = 300
//  gm1
let dynamite_count = 0
//  /gm1
let bag : string[] = []
//  bh1 edit lines below
let metal_tiles = [assets.tile`iron`, assets.tile`copper`, assets.tile`silver`, assets.tile`gold`, assets.tile`platinum`]
let metals = ["iron", "copper", "silver", "gold", "platinum"]
let tile_names = Dictionary.create(metal_tiles, metals)
let metal_value = Dictionary.create(metals, [50, 200, 500, 1000, 2000])
let mine_time = Dictionary.create(metals, [1000, 1500, 4000, 7500, 15000])
//  /bh1
//  gm1 add dynamite
let costs = Dictionary.create(["Bag capacity: ", "Dynamite: "], [5000, 3000])
//  /gm1
//  bh3
//  capacity text
let capacity_display = textsprite.create("", 1, 3)
capacity_display.setFlag(SpriteFlag.RelativeToCamera, true)
//  /bh3
//  bh3
function set_capacity_display() {
    let text = "" + bag.length + "/" + ("" + capacity)
    capacity_display.setText(text)
    capacity_display.top = 0
    capacity_display.left = 0
}

set_capacity_display()
//  /bh3
function generate_cave() {
    for (let tile of tiles.getTilesByType(assets.tile`rock`)) {
        //  bh1
        if (randint(1, 50) == 1 && tile.row < 25) {
            tiles.setTileAt(tile, assets.tile`platinum`)
        } else if (randint(1, 50) == 1 && tile.row < 50) {
            //  /bh1
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
    let is_outside = false
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
            //  bh3
            set_capacity_display()
            //  /bh3
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
        //  gm1 add count
        
        //  /gm1
        sprites.destroyAllSpritesOfKind(SpriteKind.MiniMenu)
        controller.moveSprite(me)
        let cost = Dictionary.get_values_list(costs)[selection_index]
        if (selection_index == 0) {
            if (info.score() >= cost) {
                info.changeScoreBy(-cost)
                capacity = Math.round(capacity * 1.33)
                me.say("Yay, I got it!", 3000)
                Dictionary.replaceValue(costs, Dictionary.get_keys_list(costs)[0], cost * 2)
                //  bh3
                set_capacity_display()
            } else {
                //  /bh3
                me.say("I don't have enough money", 3000)
            }
            
        }
        
        //  gm1
        if (selection_index == 1) {
            if (info.score() >= cost) {
                dynamite_count += 1
                info.changeScoreBy(-cost)
                me.say("Yay, I got it!", 3000)
            } else {
                me.say("I don't have enough money", 3000)
            }
            
        }
        
    })
})
//  /gm1
scene.onOverlapTile(SpriteKind.Player, assets.tile`diamond`, function win() {
    game.over(true)
})
//  gm1
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function pick_up_ore(me: Sprite, ore: Sprite) {
    if (bag.length >= capacity) {
        me.say("I can't carry any more", 3000)
        return
    }
    
    bag.push(sprites.readDataString(ore, "metal"))
    //  bh3 if did do gm1
    set_capacity_display()
    //  /bh3
    ore.destroy()
})
//  /gm1
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

//  gm1
function drop_ore(location: any) {
    let tile = tiles.tileImageAtLocation(location)
    let ore = sprites.create(tile.clone(), SpriteKind.Food)
    ore.image.replace(9, 0)
    tiles.placeOnTile(ore, location)
    let metal = Dictionary.get_value(tile_names, tile)
    sprites.setDataString(ore, "metal", "" + metal)
}

//  /gm1
//  bh2
function make_timer_bar(mining_time: number) {
    let bar = statusbars.create(20, 4, StatusBarKind.Energy)
    bar.attachToSprite(me)
    bar.setColor(7, 1)
    bar.max = mining_time
    bar.value = 0
    while (bar.value < bar.max) {
        bar.value += 10
        pause(10)
    }
    bar.destroy()
}

//  /bh2
function mine(location: any) {
    let metal: number;
    //  gm1 remove
    //  if len(bag) >= capacity:
    //      me.say("I can't carry any more", 3000)
    //      return
    //  /gm1
    controller.moveSprite(me, 0, 0)
    let pause_time = rock_mine_time
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0) {
        metal = Dictionary.get_value(tile_names, tiles.tileImageAtLocation(location))
        pause_time = Dictionary.get_value(mine_time, metal)
    }
    
    //  gm1 remove
    //  bag.append(str(metal))
    //  /gm1
    //  bh2
    make_timer_bar(pause_time)
    //  pause(pause_time) # remove
    //  /bh2
    //  gm1
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0) {
        drop_ore(location)
    }
    
    //  /gm1
    controller.moveSprite(me)
    tiles.setTileAt(location, assets.tile`floor`)
    tiles.setWallAt(location, false)
}

//  bh3 if didnt do gm1
//  set_capacity_display()
//  /bh3
controller.A.onEvent(ControllerButtonEvent.Pressed, function attempt_mine() {
    let location = me.tilemapLocation().getNeighboringLocation(get_direction())
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0 || tiles.tileAtLocationEquals(location, assets.tile`rock`)) {
        mine(location)
    }
    
})
//  gm1
controller.B.onEvent(ControllerButtonEvent.Pressed, function place_dynamite() {
    let is_metal: any;
    let explosion: Sprite;
    
    if (dynamite_count < 1) {
        return
    }
    
    dynamite_count -= 1
    let dynamite = sprites.create(assets.image`dynamite`, SpriteKind.Projectile)
    dynamite.lifespan = 1000
    tiles.placeOnTile(dynamite, me.tilemapLocation())
    pause(1000)
    for (let tile of tilesAdvanced.getAdjacentTiles(Shapes.Plus, dynamite.tilemapLocation(), 3)) {
        is_metal = metal_tiles.indexOf(tiles.tileImageAtLocation(tile)) >= 0
        if (is_metal) {
            drop_ore(tile)
        }
        
        if (is_metal || tiles.tileAtLocationEquals(tile, assets.tile`rock`)) {
            explosion = sprites.create(assets.image`explosion`)
            tiles.placeOnTile(explosion, tile)
            explosion.lifespan = 500
            tiles.setTileAt(tile, assets.tile`floor`)
            tiles.setWallAt(tile, false)
        }
        
    }
})
