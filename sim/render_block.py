"""Minimal Blender auto-render: one cube, RGB + depth + object mask.

Intended to be executed *inside* Blender, not with system Python:

    blender --background --python sim/render_block.py -- --out sim/output
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render one block through a 3-pass pipeline")
    parser.add_argument("--out", default="sim/output", help="Output directory")
    parser.add_argument("--size", type=int, default=512, help="Square resolution")
    parser.add_argument("--samples", type=int, default=16, help="Cycles CPU samples")
    return parser.parse_args(argv)


def after_double_dash(argv: list[str]) -> list[str]:
    return argv[argv.index("--") + 1 :] if "--" in argv else []


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_block() -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=2.0, location=(0.0, 0.0, 0.0))
    cube = bpy.context.active_object
    cube.name = "Block"
    cube.pass_index = 1

    mat = bpy.data.materials.new("BlockMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.82, 0.34, 0.12, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.4
    cube.data.materials.append(mat)
    return cube


def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(4.6, -4.6, 3.4))
    cam = bpy.context.active_object
    cam.name = "Cam"
    cam.data.lens = 50
    cam.data.clip_start = 0.1
    cam.data.clip_end = 20.0
    look_at(cam, (0.0, 0.0, 0.0))
    bpy.context.scene.camera = cam
    return cam


def add_light() -> bpy.types.Object:
    bpy.ops.object.light_add(type="SUN", location=(3.0, 2.0, 6.0))
    sun = bpy.context.active_object
    sun.name = "Sun"
    sun.data.energy = 3.0
    look_at(sun, (0.0, 0.0, 0.0))
    return sun


def setup_world() -> None:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.18, 0.20, 0.23, 1.0)
    bg.inputs["Strength"].default_value = 0.6


def setup_render(size: int, samples: int) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.frame_start = 1
    scene.frame_end = 1
    scene.frame_current = 1

    view_layer = scene.view_layers[0]
    view_layer.use_pass_combined = True
    view_layer.use_pass_z = True
    view_layer.use_pass_object_index = True


def setup_compositor(out_dir: Path) -> None:
    scene = bpy.context.scene
    scene.use_nodes = True
    scene.render.use_compositing = True
    tree = scene.node_tree
    tree.nodes.clear()

    rl = tree.nodes.new("CompositorNodeRLayers")
    rl.location = (0, 0)

    composite = tree.nodes.new("CompositorNodeComposite")
    composite.location = (720, 180)

    file_out = tree.nodes.new("CompositorNodeOutputFile")
    file_out.name = "PipelineOut"
    file_out.location = (720, -40)
    file_out.base_path = str(out_dir)
    file_out.format.file_format = "PNG"
    file_out.format.color_mode = "RGB"
    file_out.file_slots[0].path = "rgb_"

    file_out.file_slots.new("depth_")
    file_out.file_slots.new("mask_")

    # Camera is ~7.3 units from origin; clamp Z so background does not explode the range.
    depth_range = tree.nodes.new("CompositorNodeMapRange")
    depth_range.location = (360, -40)
    depth_range.use_clamp = True
    depth_range.inputs[1].default_value = 3.0
    depth_range.inputs[2].default_value = 12.0
    depth_range.inputs[3].default_value = 0.0
    depth_range.inputs[4].default_value = 1.0

    mask_gt = tree.nodes.new("CompositorNodeMath")
    mask_gt.location = (360, -220)
    mask_gt.operation = "GREATER_THAN"
    mask_gt.inputs[1].default_value = 0.5

    links = tree.links
    links.new(rl.outputs["Image"], composite.inputs["Image"])
    links.new(rl.outputs["Image"], file_out.inputs[0])
    links.new(rl.outputs["Depth"], depth_range.inputs[0])
    links.new(depth_range.outputs[0], file_out.inputs[1])
    links.new(rl.outputs["IndexOB"], mask_gt.inputs[0])
    links.new(mask_gt.outputs[0], file_out.inputs[2])


def flatten_named(out_dir: Path, prefix: str, dest_name: str) -> Path:
    matches = sorted(
        p
        for p in out_dir.glob(f"{prefix}*")
        if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".exr"}
    )
    if not matches:
        raise FileNotFoundError(f"no render written for prefix {prefix!r} in {out_dir}")
    dest = out_dir / dest_name
    if matches[0].resolve() != dest.resolve():
        if dest.exists():
            dest.unlink()
        matches[0].rename(dest)
    return dest


def write_manifest(out_dir: Path, args: argparse.Namespace, cube, cam) -> Path:
    payload = {
        "pipeline": "block-v0",
        "blender": {
            "version": list(bpy.app.version),
            "engine": bpy.context.scene.render.engine,
            "device": bpy.context.scene.cycles.device,
            "samples": args.samples,
            "size": [args.size, args.size],
        },
        "block": {
            "name": cube.name,
            "location": list(cube.location),
            "size": 2.0,
            "pass_index": cube.pass_index,
        },
        "camera": {
            "location": list(cam.location),
            "rotation_euler_rad": list(cam.rotation_euler),
            "distance_to_origin": float(Vector(cam.location).length),
        },
        "outputs": ["rgb.png", "depth.png", "mask.png"],
    }
    path = out_dir / "run.json"
    path.write_text(json.dumps(payload, indent=2) + "\n")
    return path


def main() -> None:
    args = parse_args(after_double_dash(sys.argv))
    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    reset_scene()
    cube = add_block()
    cam = add_camera()
    add_light()
    setup_world()
    setup_render(args.size, args.samples)
    setup_compositor(out_dir)

    bpy.ops.render.render(write_still=False)

    rgb = flatten_named(out_dir, "rgb_", "rgb.png")
    depth = flatten_named(out_dir, "depth_", "depth.png")
    mask = flatten_named(out_dir, "mask_", "mask.png")
    for leftover in out_dir.glob("*_0001.png"):
        leftover.unlink()
    manifest = write_manifest(out_dir, args, cube, cam)

    print(f"wrote {rgb}")
    print(f"wrote {depth}")
    print(f"wrote {mask}")
    print(f"wrote {manifest}")


if __name__ == "__main__":
    main()
