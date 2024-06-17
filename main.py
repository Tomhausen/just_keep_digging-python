# spirtes
me = sprites.create(assets.image("me"), SpriteKind.player)
controller.move_sprite(me)
me.z = 10

# setup
scene.set_tile_map_level(assets.tilemap("outside"))
tiles.place_on_tile(me, tiles.get_tile_location(6, 2))
scene.camera_follow_sprite(me)
info.set_score(100000)
music.set_volume(20)

# vars
capacity = 10
rock_mine_time = 300
# gm1
dynamite_count = 0
# /gm1
bag: List[string] = []
# bh1 edit lines below
metal_tiles = [assets.tile("iron"), assets.tile("copper"), assets.tile("silver"), assets.tile("gold"), assets.tile("platinum")]
metals = ["iron", "copper", "silver", "gold", "platinum"]
tile_names = Dictionary.create(metal_tiles, metals)
metal_value = Dictionary.create(metals, [50, 200, 500, 1000, 2000])
mine_time = Dictionary.create(metals, [1000, 1500, 4000, 7500, 15000])
# /bh1
# gm1 add dynamite
costs = Dictionary.create(["Bag capacity: ", "Dynamite: "], [5000, 3000])
# /gm1

# bh3
# capacity text
capacity_display = textsprite.create("", 1, 3)
capacity_display.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)
# /bh3

# bh3
def set_capacity_display():
    text = str(len(bag)) + "/" + str(capacity)
    capacity_display.set_text(text)
    capacity_display.top = 0
    capacity_display.left = 0
set_capacity_display()
# /bh3

def generate_cave():
    for tile in tiles.get_tiles_by_type(assets.tile("rock")):
        # bh1
        if randint(1, 50) == 1 and tile.row < 25:
            tiles.set_tile_at(tile, assets.tile("platinum"))
        # /bh1
        if randint(1, 50) == 1 and tile.row < 50:
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

def sell():
    for item in bag:
        info.change_score_by(Dictionary.get_value(metal_value, item))
        bag.remove_element(item)
        # bh3
        set_capacity_display()
        # /bh3
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
    # gm1 add count
    global capacity, dynamite_count
    # /gm1
    sprites.destroy_all_sprites_of_kind(SpriteKind.mini_menu)
    controller.move_sprite(me)
    cost = Dictionary.get_values_list(costs)[selection_index]
    if selection_index == 0:
        if info.score() >= cost:
            info.change_score_by(-cost)
            capacity = Math.round(capacity * 1.33)
            me.say("Yay, I got it!", 3000)
            Dictionary.replace_value(costs, Dictionary.get_keys_list(costs)[0], cost * 2)
            # bh3
            set_capacity_display()
            # /bh3
        else:
            me.say("I don't have enough money", 3000)
    # gm1
    if selection_index == 1:
        if info.score() >= cost:
            dynamite_count += 1
            info.change_score_by(-cost)
            me.say("Yay, I got it!", 3000)
        else:
            me.say("I don't have enough money", 3000)
    # /gm1

def win():
    game.over(True)
scene.on_overlap_tile(SpriteKind.player, assets.tile("diamond"), win)

# gm1
def pick_up_ore(me, ore):
    if len(bag) >= capacity:
        me.say("I can't carry any more", 3000)
        return
    bag.append(sprites.read_data_string(ore, "metal"))
    # bh3 if did do gm1
    set_capacity_display()
    # /bh3
    ore.destroy()
sprites.on_overlap(SpriteKind.player, SpriteKind.food, pick_up_ore)
# /gm1

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

# gm1
def drop_ore(location):
    tile = tiles.tile_image_at_location(location)
    ore = sprites.create(tile.clone(), SpriteKind.food)
    ore.image.replace(9, 0)
    tiles.place_on_tile(ore, location)
    metal = Dictionary.get_value(tile_names, tile)
    sprites.set_data_string(ore, "metal", str(metal))
# /gm1

# bh2
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
# /bh2

def mine(location):
    # gm1 remove
    # if len(bag) >= capacity:
    #     me.say("I can't carry any more", 3000)
    #     return
    # /gm1
    controller.move_sprite(me, 0, 0)
    pause_time = rock_mine_time
    if tiles.tile_image_at_location(location) in metal_tiles:
        metal = Dictionary.get_value(tile_names, tiles.tile_image_at_location(location))
        pause_time = Dictionary.get_value(mine_time, metal)
        # gm1 remove
        # bag.append(str(metal))
        # /gm1
    # bh2
    make_timer_bar(pause_time)
    # pause(pause_time) # remove
    # /bh2
    # gm1
    if tiles.tile_image_at_location(location) in metal_tiles:
        drop_ore(location)
    # /gm1
    controller.move_sprite(me)
    tiles.set_tile_at(location, assets.tile("floor"))
    tiles.set_wall_at(location, False)
    # bh3 if didnt do gm1
    # set_capacity_display()
    # /bh3

def attempt_mine():
    location = me.tilemap_location().get_neighboring_location(get_direction())
    if (tiles.tile_image_at_location(location) in metal_tiles
            or tiles.tile_at_location_equals(location, assets.tile("rock"))):
        mine(location)
controller.A.on_event(ControllerButtonEvent.PRESSED, attempt_mine)

# gm1
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
# /gm1

# gh1 drop on floor and buy dynamite - DONE
# bh1 new thing to mine - DONE
# bh2 use status bar to show mining time - DONE
# bh3 show capacity - DONE
