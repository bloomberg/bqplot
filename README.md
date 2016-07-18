bqplot
======

bqplot is a Grammar of Graphics based interactive plotting framework for the Jupyter notebook.

[![bqplot](./bqplot-screencast.gif)](https://github.com/bloomberg/bqplot/blob/master/examples/Applications/Wealth%20of%20Nations.ipynb)

In bqplot, every single attribute of the plot is an interactive widget. This allows the user to integrate any plot with iPython widgets to create a complex and feature rich GUI from just a few simple lines of Python code.

Goals
-----

-   provide a unified framework for 2-D visualizations with a pythonic API.
-   provide a sensible API for adding user interactions (panning, zooming, selection, etc)

Two APIs are provided

- Users can build custom visualizations using the internal object model, which
  is inspired by the constructs of the Grammar of Graphics (figure, marks, axes,
  scales), and enrich their visualization with our Interaction Layer.
- Or they can use the context-based API similar to Matplotlib's pyplot, which
  provides sensible default choices for most parameters.

Getting Started
---------------

### Dependencies

This package depends on the following packages:

-   `numpy`
-   `ipywidgets` (version >=5.0.0)

### Installation

Using pip:

```
$ pip install bqplot
$ jupyter nbextension enable --py bqplot
```

Using conda

```
$ conda install -c conda-forge bqplot
```

For a development installation (requires npm):

```
$ git clone https://github.com/bloomberg/bqplot.git
$ cd bqplot
$ pip install -e .
$ jupyter nbextension install --py --symlink --user bqplot
$ jupyter nbextension enable --py --user bqplot
```

Note for developers: the `--symlink` argument on Linux or OS X allows one to
modify the JavaScript code in-place. This feature is not available
with Windows.


### Loading `bqplot`

```python
# In a Jupyter notebook
import bqplot
```

That's it! You're ready to go!

Examples
--------

### Using the `pyplot` API

```python
from bqplot import pyplot as plt
import numpy as np

plt.figure(1)
np.random.seed(0)
n = 200
x = np.linspace(0.0, 10.0, n)
y = np.cumsum(np.random.randn(n))
plt.plot(x, y)
plt.show()
```

[![Pyplot Screenshot](/pyplot-screenshot.png)](https://github.com/bloomberg/bqplot/blob/master/examples/Basic%20Plotting/Pyplot.ipynb)

### Using the `bqplot` internal object model


```python
import numpy as np
from IPython.display import display
from bqplot import (OrdinalScale, LinearScale, Bars,
                    Lines, Axis, Figure)

size = 20
np.random.seed(0)

x_data = np.arange(size)

x_ord = OrdinalScale()
y_sc = LinearScale()

bar = Bars(x=x_data, y=np.random.randn(2, size), scales={'x': x_ord, 'y': y_sc},
              type='stacked')
line = Lines(x=x_data, y=np.random.randn(size), scales={'x': x_ord, 'y': y_sc},
                stroke_width=3, colors=['red'], display_legend=True, labels=['Line chart'])

ax_x = Axis(scale=x_ord, label='X-Axis')
ax_y = Axis(scale=y_sc, orientation='vertical', tick_format='0.2f', label='Y-Axis')

fig = Figure(marks=[bar, line], axes=[ax_x, ax_y], title='API Example')
display(fig)
```

[![Bqplot Screenshot](/bqplot-screenshot.png)](https://github.com/bloomberg/bqplot/blob/master/examples/Advanced%20Plotting/Advanced%20Plotting.ipynb)


Help / Documentation
--------------------

- API reference documentation: [![Read the documentation of the stable version](https://readthedocs.org/projects/pip/badge/?version=stable)](http://bqplot.readthedocs.org/en/stable/) [![Read the documentation of the development version](https://readthedocs.org/projects/pip/badge/?version=latest)](http://bqplot.readthedocs.org/en/latest/)

- Talk to us on the `ipywidgets` Gitter chat: [![Join the chat at https://gitter.im/ipython/ipywidgets](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/ipython/ipywidgets?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

License
-------

This software is licensed under the Apache 2.0 license. See the [LICENSE](LICENSE) file
for details.

