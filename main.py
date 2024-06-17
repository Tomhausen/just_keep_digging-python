# spirtes
me = sprites.create(assets.image("me"), SpriteKind.player)
controller.move_sprite(me)
me.z = 10
# bh4
characterAnimations.loop_frames(me, assets.animation("down"), 100, characterAnimations.rule(Predicate.MOVING_DOWN))
characterAnimations.loop_frames(me, assets.animation("up"), 100, characterAnimations.rule(Predicate.MOVING_UP))
characterAnimations.loop_frames(me, assets.animation("left"), 100, characterAnimations.rule(Predicate.MOVING_LEFT))
characterAnimations.loop_frames(me, assets.animation("right"), 100, characterAnimations.rule(Predicate.MOVING_RIGHT))
characterAnimations.loop_frames(me, [assets.image("me")], 100, characterAnimations.rule(Predicate.NOT_MOVING))
# /bh4

# setup
scene.set_tile_map_level(assets.tilemap("outside"))
tiles.place_on_tile(me, tiles.get_tile_location(6, 2))
scene.camera_follow_sprite(me)
info.set_score(100000)
music.set_volume(20)

# vars
capacity = 10
rock_mine_time = 300
dynamite_count = 0
# gm2
mining_level = 0
# /gm2
bag: List[string] = []
metal_tiles = [assets.tile("iron"), assets.tile("copper"), assets.tile("silver"), assets.tile("gold"), assets.tile("platinum")]
metals = ["iron", "copper", "silver", "gold", "platinum"]
tile_names = Dictionary.create(metal_tiles, metals)
metal_value = Dictionary.create(metals, [50, 200, 500, 1000, 2000])
mine_time = Dictionary.create(metals, [1000, 1500, 4000, 7500, 15000])
costs = Dictionary.create(["Bag capacity: ", "Dynamite: "], [5000, 3000])
# gm2 only add final number if did bh1
level_requirement = Dictionary.create(metals, [1, 2, 5, 10, 15])
# /gm2

# capacity text
capacity_display = textsprite.create("", 1, 3)
capacity_display.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)

# gm2
# XP bar
xp_bar = statusbars.create(160, 8, StatusBarKind.magic)
xp_bar.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)
xp_bar.bottom = 120
background = sprites.create(image.create(160, 8))
background.image.fill(1)
background.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)
background.bottom = 120
# /gm2

# gm2
def level_up():
    global mining_level
    mining_level += 1
    xp_bar.set_label(str(mining_level), 3)
    xp_bar.max = mining_level * 1000
    xp_bar.value = 0
level_up()
# /gm2

# gm2
def reduce_mining_times():
    for key in Dictionary.get_keys_list(mine_time):
        new_time = Dictionary.get_value(mine_time, key) * 0.75
        Dictionary.replace_value(mine_time, key, new_time)
# /gm2

def set_capacity_display():
    text = str(len(bag)) + "/" + str(capacity)
    capacity_display.set_text(text)
    capacity_display.top = 0
    capacity_display.left = 0
set_capacity_display()

def generate_cave():
    for tile in tiles.get_tiles_by_type(assets.tile("rock")):
        if randint(1, 50) == 1 and tile.row < 25:
            tiles.set_tile_at(tile, assets.tile("platinum"))
        elif randint(1, 50) == 1 and tile.row < 50:
            tiles.set_tile_at(tile, assets.tile("gold"))
        elif randint(1, 30) == 1 and tile.row < 75:
            tiles.set_tile_at(tile, assets.tile("silver"))
        elif randint(1, 20) == 1:
            tiles.set_tile_at(tile, assets.tile("copper"))
        elif randint(1, 5) == 1:
            tiles.set_tile_at(tile, assets.tile("iron"))
    tiles.set_tile_at(tiles.get_tile_location(randint(1, 98), 1), assets.tile("diamond"))
    tilesAdvanced.set_wall_on_tiles_of_type(assets.tile("diamond"), False)

def enter(me, entrance):
    scene.set_tile_map_level(assets.tilemap("cave"))
    tiles.place_on_random_tile(me, assets.tile("exit"))
    me.y -= 16
    generate_cave()
    is_outside = False
scene.on_overlap_tile(SpriteKind.player, assets.tile("entrance"), enter)

def exit(me, exit):
    scene.set_tile_map_level(assets.tilemap("outside"))
    tiles.place_on_random_tile(me, assets.tile("entrance"))
    me.y += 16
scene.on_overlap_tile(SpriteKind.player, assets.tile("exit"), exit)

# bh5
def sell_effect(cost):
    music.ba_ding.play()
    cost_text = textsprite.create(str(cost))
    cost_text.set_outline(1, 15)
    tiles.place_on_random_tile(cost_text, assets.tile("sell"))
    cost_text.vy = -50
    cost_text.lifespan = 750
# /bh5

def sell():
    for item in bag:
        info.change_score_by(Dictionary.get_value(metal_value, item))
        # bh5
        sell_effect(Dictionary.get_value(metal_value, item))
        # /bh5
        bag.remove_element(item)
        set_capacity_display()
        pause(500)

def collide_with_chest(me, location):
    timer.background(sell)
scene.on_overlap_tile(SpriteKind.player, assets.tile("sell"), collide_with_chest)

def open_shop(me, location):
    tiles.place_on_tile(me, me.tilemap_location())
    controller.move_sprite(me, 0, 0)
    shop = []
    for key in Dictionary.get_keys_list(costs):
        value = Dictionary.get_value(costs, key)
        shop.append(miniMenu.create_menu_item(key + str(value)))
    shop.append(miniMenu.create_menu_item("Exit"))
    menu = miniMenu.create_menu_from_array(shop)
    menu.z = 100
    menu.set_title("UPGRADES")
    menu.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)
    menu.on_button_pressed(controller.A, buy)
scene.on_overlap_tile(SpriteKind.player, assets.tile("buy"), open_shop)

def buy(selection, selection_index):
    global capacity, dynamite_count
    sprites.destroy_all_sprites_of_kind(SpriteKind.mini_menu)
    controller.move_sprite(me)
    cost = Dictionary.get_values_list(costs)[selection_index]
    if selection_index == 0:
        if info.score() >= cost:
            info.change_score_by(-cost)
            capacity = Math.round(capacity * 1.33)
            me.say("Yay, I got it!", 3000)
            Dictionary.replace_value(costs, Dictionary.get_keys_list(costs)[0], cost * 2)
            set_capacity_display()
        else:
            me.say("I don't have enough money", 3000)
    if selection_index == 1:
        if info.score() >= cost:
            dynamite_count += 1
            info.change_score_by(-cost)
            me.say("Yay, I got it!", 3000)
        else:
            me.say("I don't have enough money", 3000)

def win():
    game.over(True)
scene.on_overlap_tile(SpriteKind.player, assets.tile("diamond"), win)

def pick_up_ore(me, ore):
    if len(bag) >= capacity:
        me.say("I can't carry any more", 3000)
        return
    bag.append(sprites.read_data_string(ore, "metal"))
    set_capacity_display()
    # gm2 if did gm1
    xp_bar.value += Dictionary.get_value(metal_value, sprites.read_data_string(ore, "metal"))
    if xp_bar.value >= xp_bar.max:
        level_up()
        reduce_mining_times()
        music.power_up.play()
        effects.confetti.start_screen_effect(3000)
    # /gm2
    ore.destroy()
sprites.on_overlap(SpriteKind.player, SpriteKind.food, pick_up_ore)

def get_direction():
    if controller.up.is_pressed():
        return CollisionDirection.TOP
    elif controller.down.is_pressed():
        return CollisionDirection.BOTTOM
    elif controller.left.is_pressed():
        return CollisionDirection.LEFT
    elif controller.right.is_pressed():
        return CollisionDirection.RIGHT
    return -1

def drop_ore(location):
    tile = tiles.tile_image_at_location(location)
    ore = sprites.create(tile.clone(), SpriteKind.food)
    ore.image.replace(9, 0)
    tiles.place_on_tile(ore, location)
    metal = Dictionary.get_value(tile_names, tile)
    sprites.set_data_string(ore, "metal", str(metal))

def make_timer_bar(mining_time):
    bar = statusbars.create(20, 4, StatusBarKind.energy)
    bar.attach_to_sprite(me)
    bar.set_color(7, 1)
    bar.max = mining_time
    bar.value = 0
    while bar.value < bar.max:
        bar.value += 10
        pause(10)
    bar.destroy()

# bh6
def destroy_block(location, mine_time):
    block = sprites.create(tiles.tile_image_at_location(location))
    tiles.place_on_tile(block, location)
    block.destroy(effects.disintegrate, mine_time)
    scene.camera_shake(4, mine_time)
    music.big_crash.play()
# /bh6

def mine(location):
    controller.move_sprite(me, 0, 0)
    pause_time = rock_mine_time
    if tiles.tile_image_at_location(location) in metal_tiles:
        metal = Dictionary.get_value(tile_names, tiles.tile_image_at_location(location))
        pause_time = Dictionary.get_value(mine_time, metal)
        # gm2
        if Dictionary.get_value(level_requirement, metal) > mining_level:
            me.say("I can't mine this yet", 3000)
            controller.move_sprite(me)
            return
        # /gm2
    # bh6
    destroy_block(location, pause_time)
    # /bh6
    make_timer_bar(pause_time)
    if tiles.tile_image_at_location(location) in metal_tiles:
        drop_ore(location)
    # gm2 if didnt gm1
    # if tiles.tile_image_at_location(location) in metal_tiles:
    #     xp_bar.value += Dictionary.get_value(metal_value, str(metal))
    #     if xp_bar.value >= xp_bar.max:
    #         level_up()
    #         reduce_mining_times()
    #         music.power_up.play()
    #         effects.confetti.start_screen_effect(3000)
    # /gm2
    controller.move_sprite(me)
    tiles.set_tile_at(location, assets.tile("floor"))
    tiles.set_wall_at(location, False)


def attempt_mine():
    location = me.tilemap_location().get_neighboring_location(get_direction())
    if (tiles.tile_image_at_location(location) in metal_tiles
            or tiles.tile_at_location_equals(location, assets.tile("rock"))):
        mine(location)
controller.A.on_event(ControllerButtonEvent.PRESSED, attempt_mine)

def place_dynamite():
    global dynamite_count
    if dynamite_count < 1:
        return
    dynamite_count -= 1
    dynamite = sprites.create(assets.image("dynamite"), SpriteKind.projectile)
    dynamite.lifespan = 1000
    tiles.place_on_tile(dynamite, me.tilemap_location())
    pause(1000)
    for tile in tilesAdvanced.get_adjacent_tiles(Shapes.PLUS, dynamite.tilemap_location(), 3):
        is_metal = tiles.tile_image_at_location(tile) in metal_tiles
        if is_metal:
            drop_ore(tile)
        if is_metal or tiles.tile_at_location_equals(tile, assets.tile("rock")):
            explosion = sprites.create(assets.image("explosion"))
            tiles.place_on_tile(explosion, tile)
            explosion.lifespan = 500
            tiles.set_tile_at(tile, assets.tile("floor"))
            tiles.set_wall_at(tile, False)
controller.B.on_event(ControllerButtonEvent.PRESSED, place_dynamite)

# gh1 drop on floor and super drill power up GM - DONE
# bh1 new thing to mine - DONE
# bh2 use status bar to show mining time - DONE
# bh3 show capacity - DONE

# gh2 upgrade pickaxe GM - DONE
# bh4 walking anim - DONE
# bh5 sale effect - DONE
# bh6 animate tile being destroyed - DONE MAYBE DITCH THIS FOR SOMETHING BETTER?

