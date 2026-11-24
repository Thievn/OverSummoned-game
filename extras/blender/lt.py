import bpy,sys,math
exec(open('rig.py').read().split("meta = {}")[0])
sh.light='STUDIO'; sh.use_world_space_lighting=True
pose(SPEC['anims']['idle'][0])
for a in (-135,-90,-45,0,45,90,135,180):
    sh.studiolight_rotate_z=math.radians(a); sc.render.filepath=f'/tmp/lt_{a}.png'; bpy.ops.render.render(write_still=True)
