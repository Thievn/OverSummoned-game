"""Peel pale ground-shadow fringe off a cutout.

An older cleanup wrapped every cutout, fringe included, in a navy ink line, which trapped the
fringe inside the outline. This lifts that line in the lower part of the picture, peels the pale
colourless pixels that touch empty space, and inks the new edge again.

  from fringe import peel;  new_rgba, removed_mask = peel(rgba, start=0.5)
"""
import numpy as np
from scipy import ndimage

INK = np.array([16, 22, 42])


def peel(a, start=0.5, depth=80):
    a = a.copy(); H, W = a.shape[:2]; yy = np.mgrid[0:H, 0:W][0]
    rgb = a[..., :3].astype(np.int16); low = yy > H * start
    solid = a[..., 3] > 20; before = solid.copy()
    inkish = np.abs(rgb - INK).max(axis=2) < 14
    solid &= ~(inkish & ndimage.binary_dilation(~solid, iterations=4) & low)
    pale = (rgb.min(axis=2) > 38) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 24) & low
    for _ in range(depth):
        edge = ndimage.binary_dilation(~solid, iterations=1) & solid & (pale | (inkish & low))
        if not edge.any(): break
        solid &= ~edge
    solid = ndimage.binary_opening(solid, iterations=1) | (solid & ~low)
    lab, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1)); solid &= np.isin(lab, [i + 1 for i, v in enumerate(sizes) if v > 400])
    newink = ndimage.binary_dilation(solid, iterations=2) & ~solid & low & before
    removed = before & ~solid & ~newink
    a[..., 3][~solid] = 0
    a[..., :3][newink] = INK; a[..., 3][newink] = 255
    return a, removed
