//  spirtes
let me = sprites.create(assets.image`me`, SpriteKind.Player)
controller.moveSprite(me)
me.z = 10
//  bh4
characterAnimations.loopFrames(me, assets.animation`down`, 100, characterAnimations.rule(Predicate.MovingDown))
characterAnimations.loopFrames(me, assets.animation`up`, 100, characterAnimations.rule(Predicate.MovingUp))
characterAnimations.loopFrames(me, assets.animation`left`, 100, characterAnimations.rule(Predicate.MovingLeft))
characterAnimations.loopFrames(me, assets.animation`right`, 100, characterAnimations.rule(Predicate.MovingRight))
characterAnimations.loopFrames(me, [assets.image`me`], 100, characterAnimations.rule(Predicate.NotMoving))
//  /bh4
//  setup
scene.setTileMapLevel(assets.tilemap`outside`)
tiles.placeOnTile(me, tiles.getTileLocation(6, 2))
scene.cameraFollowSprite(me)
info.setScore(100000)
music.setVolume(20)
//  vars
let capacity = 10
let rock_mine_time = 300
let dynamite_count = 0
//  gm2
let mining_level = 0
//  /gm2
let bag : string[] = []
let metal_tiles = [assets.tile`iron`, assets.tile`copper`, assets.tile`silver`, assets.tile`gold`, assets.tile`platinum`]
let metals = ["iron", "copper", "silver", "gold", "platinum"]
let tile_names = Dictionary.create(metal_tiles, metals)
let metal_value = Dictionary.create(metals, [50, 200, 500, 1000, 2000])
let mine_time = Dictionary.create(metals, [1000, 1500, 4000, 7500, 15000])
let costs = Dictionary.create(["Bag capacity: ", "Dynamite: "], [5000, 3000])
//  gm2 only add final number if did bh1
let level_requirement = Dictionary.create(metals, [1, 2, 5, 10, 15])
//  /gm2
//  capacity text
let capacity_display = textsprite.create("", 1, 3)
capacity_display.setFlag(SpriteFlag.RelativeToCamera, true)
//  gm2
//  XP bar
let xp_bar = statusbars.create(160, 8, StatusBarKind.Magic)
xp_bar.setFlag(SpriteFlag.RelativeToCamera, true)
xp_bar.bottom = 120
let background = sprites.create(image.create(160, 8))
background.image.fill(1)
background.setFlag(SpriteFlag.RelativeToCamera, true)
background.bottom = 120
//  /gm2
//  gm2
function level_up() {
    
    mining_level += 1
    xp_bar.setLabel("" + mining_level, 3)
    xp_bar.max = mining_level * 1000
    xp_bar.value = 0
}

level_up()
//  /gm2
//  gm2
function reduce_mining_times() {
    let new_time: number;
    for (let key of Dictionary.get_keys_list(mine_time)) {
        new_time = Dictionary.get_value(mine_time, key) * 0.75
        Dictionary.replaceValue(mine_time, key, new_time)
    }
}

//  /gm2
function set_capacity_display() {
    let text = "" + bag.length + "/" + ("" + capacity)
    capacity_display.setText(text)
    capacity_display.top = 0
    capacity_display.left = 0
}

set_capacity_display()
function generate_cave() {
    for (let tile of tiles.getTilesByType(assets.tile`rock`)) {
        if (randint(1, 50) == 1 && tile.row < 25) {
            tiles.setTileAt(tile, assets.tile`platinum`)
        } else if (randint(1, 50) == 1 && tile.row < 50) {
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
//  bh5
function sell_effect(cost: number) {
    music.baDing.play()
    let cost_text = textsprite.create("" + cost)
    cost_text.setOutline(1, 15)
    tiles.placeOnRandomTile(cost_text, assets.tile`sell`)
    cost_text.vy = -50
    cost_text.lifespan = 750
}

//  /bh5
scene.onOverlapTile(SpriteKind.Player, assets.tile`sell`, function collide_with_chest(me: Sprite, location: tiles.Location) {
    timer.background(function sell() {
        for (let item of bag) {
            info.changeScoreBy(Dictionary.get_value(metal_value, item))
            //  bh5
            sell_effect(Dictionary.get_value(metal_value, item))
            //  /bh5
            bag.removeElement(item)
            set_capacity_display()
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
        
        sprites.destroyAllSpritesOfKind(SpriteKind.MiniMenu)
        controller.moveSprite(me)
        let cost = Dictionary.get_values_list(costs)[selection_index]
        if (selection_index == 0) {
            if (info.score() >= cost) {
                info.changeScoreBy(-cost)
                capacity = Math.round(capacity * 1.33)
                me.say("Yay, I got it!", 3000)
                Dictionary.replaceValue(costs, Dictionary.get_keys_list(costs)[0], cost * 2)
                set_capacity_display()
            } else {
                me.say("I don't have enough money", 3000)
            }
            
        }
        
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
scene.onOverlapTile(SpriteKind.Player, assets.tile`diamond`, function win() {
    game.over(true)
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function pick_up_ore(me: Sprite, ore: Sprite) {
    if (bag.length >= capacity) {
        me.say("I can't carry any more", 3000)
        return
    }
    
    bag.push(sprites.readDataString(ore, "metal"))
    set_capacity_display()
    //  gm2 if did gm1
    xp_bar.value += Dictionary.get_value(metal_value, sprites.readDataString(ore, "metal"))
    if (xp_bar.value >= xp_bar.max) {
        level_up()
        reduce_mining_times()
        music.powerUp.play()
        effects.confetti.startScreenEffect(3000)
    }
    
    //  /gm2
    ore.destroy()
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

function drop_ore(location: any) {
    let tile = tiles.tileImageAtLocation(location)
    let ore = sprites.create(tile.clone(), SpriteKind.Food)
    ore.image.replace(9, 0)
    tiles.placeOnTile(ore, location)
    let metal = Dictionary.get_value(tile_names, tile)
    sprites.setDataString(ore, "metal", "" + metal)
}

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

//  bh6
function destroy_block(location: any, mine_time: number) {
    let block = sprites.create(tiles.tileImageAtLocation(location))
    tiles.placeOnTile(block, location)
    block.destroy(effects.disintegrate, mine_time)
    scene.cameraShake(4, mine_time)
    music.bigCrash.play()
}

//  /bh6
function mine(location: any) {
    let metal: number;
    controller.moveSprite(me, 0, 0)
    let pause_time = rock_mine_time
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0) {
        metal = Dictionary.get_value(tile_names, tiles.tileImageAtLocation(location))
        pause_time = Dictionary.get_value(mine_time, metal)
        //  gm2
        if (Dictionary.get_value(level_requirement, metal) > mining_level) {
            me.say("I can't mine this yet", 3000)
            controller.moveSprite(me)
            return
        }
        
    }
    
    //  /gm2
    //  bh6
    destroy_block(location, pause_time)
    //  /bh6
    make_timer_bar(pause_time)
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0) {
        drop_ore(location)
    }
    
    //  gm2 if didnt gm1
    //  if tiles.tile_image_at_location(location) in metal_tiles:
    //      xp_bar.value += Dictionary.get_value(metal_value, str(metal))
    //      if xp_bar.value >= xp_bar.max:
    //          level_up()
    //          reduce_mining_times()
    //          music.power_up.play()
    //          effects.confetti.start_screen_effect(3000)
    //  /gm2
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
