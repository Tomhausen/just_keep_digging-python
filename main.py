# spirtes
me = sprites.create(assets.image("me"), SpriteKind.player)
controller.move_sprite(me)
me.z = 10

# setup 
scene.set_tile_map_level(assets.tilemap("outside"))
tiles.place_on_tile(me, tiles.get_tile_location(6, 2))
scene.camera_follow_sprite(me)
info.set_score(0)
music.set_volume(20)

# vars
capacity = 10
rock_mine_time = 300
bag: List[string] = []
metal_tiles = [assets.tile("iron"), assets.tile("copper"), assets.tile("silver"), assets.tile("gold")]
metals = ["iron", "copper", "silver", "gold"]
tile_names = Dictionary.create(metal_tiles, metals)
metal_value = Dictionary.create(metals, [50, 200, 500, 1000])
mine_time = Dictionary.create(metals, [1000, 1500, 4000, 7500])
costs = Dictionary.create(["Bag capacity: "], [5000])

def generate_cave():
    for tile in tiles.get_tiles_by_type(assets.tile("rock")):
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
    sprites.destroy_all_sprites_of_kind(SpriteKind.mini_menu)
    controller.move_sprite(me)
    cost = Dictionary.get_values_list(costs)[selection_index]
    if selection_index == 0:
        if info.score() >= cost:
            info.change_score_by(-cost)
            capacity = Math.round(capacity * 1.33)
            me.say("Yay, I got it!", 3000)
            Dictionary.replace_value(costs, Dictionary.get_keys_list(costs)[0], cost * 2)
        else:
            me.say("I don't have enough money", 3000)

def win():
    game.over(True)
scene.on_overlap_tile(SpriteKind.player, assets.tile("diamond"), win)

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

def mine(location):
    if len(bag) >= capacity:
        me.say("I can't carry any more", 3000)
        return
    controller.move_sprite(me, 0, 0)
    pause_time = rock_mine_time
    if tiles.tile_image_at_location(location) in metal_tiles:
        metal = Dictionary.get_value(tile_names, tiles.tile_image_at_location(location))
        pause_time = Dictionary.get_value(mine_time, metal)
        bag.append(str(metal))
    pause(pause_time)
    controller.move_sprite(me)
    tiles.set_tile_at(location, assets.tile("floor"))
    tiles.set_wall_at(location, False)

def attempt_mine():
    location = me.tilemap_location().get_neighboring_location(get_direction())
    if (tiles.tile_image_at_location(location) in metal_tiles 
            or tiles.tile_at_location_equals(location, assets.tile("rock"))):
        mine(location)
controller.A.on_event(ControllerButtonEvent.PRESSED, attempt_mine)
